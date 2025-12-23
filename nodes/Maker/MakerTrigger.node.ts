/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	ITriggerFunctions,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
	IDataObject,
} from 'n8n-workflow';
import { ethers, Contract, JsonRpcProvider } from 'ethers';

import { MAINNET_CONTRACTS, DEFAULT_RPC_URLS } from './constants/contracts';
import { ERC20_ABI } from './transport/mcdClient';
import { fromWad, fromRay } from './utils/mathUtils';

// Licensing notice - logged once per node load (shared with Maker node)
const LICENSING_NOTICE_LOGGED = Symbol.for('n8n-nodes-maker-licensing-logged');
if (!(globalThis as Record<symbol, boolean>)[LICENSING_NOTICE_LOGGED]) {
	console.warn(`[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
`);
	(globalThis as Record<symbol, boolean>)[LICENSING_NOTICE_LOGGED] = true;
}

// Event ABIs
const DAI_TRANSFER_EVENT = 'event Transfer(address indexed from, address indexed to, uint256 value)';
const VAULT_FROB_EVENT = 'event Frob(bytes32 indexed i, address indexed u, address v, address w, int256 dink, int256 dart)';
const POT_DRIP_EVENT = 'event LogNote(bytes4 indexed sig, address indexed usr, bytes32 indexed arg1, bytes32 indexed arg2, bytes data)';
const CHIEF_VOTE_EVENT = 'event LogNote(bytes4 indexed sig, address indexed guy, bytes32 indexed foo, bytes32 indexed bar, uint256 wad, bytes fax)';

export class MakerTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Maker Trigger',
		name: 'makerTrigger',
		icon: 'file:maker.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Triggers when Maker Protocol events occur - vault changes, DAI transfers, governance votes, and more',
		defaults: {
			name: 'Maker Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'makerNetwork',
				required: true,
			},
		],
		polling: true,
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: [
					{
						name: 'DAI Transfer',
						value: 'daiTransfer',
						description: 'Triggers when DAI is transferred',
					},
					{
						name: 'DAI Large Transfer',
						value: 'daiLargeTransfer',
						description: 'Triggers when a large DAI transfer occurs',
					},
					{
						name: 'DSR Rate Changed',
						value: 'dsrRateChanged',
						description: 'Triggers when DSR rate changes',
					},
					{
						name: 'Governance Vote Cast',
						value: 'governanceVote',
						description: 'Triggers when a governance vote is cast',
					},
					{
						name: 'MKR Transfer',
						value: 'mkrTransfer',
						description: 'Triggers when MKR is transferred',
					},
					{
						name: 'Price Updated',
						value: 'priceUpdated',
						description: 'Triggers when oracle price is updated',
					},
					{
						name: 'sDAI Deposit',
						value: 'sdaiDeposit',
						description: 'Triggers when DAI is deposited to sDAI',
					},
					{
						name: 'sDAI Withdrawal',
						value: 'sdaiWithdrawal',
						description: 'Triggers when sDAI is redeemed',
					},
					{
						name: 'System Parameter Changed',
						value: 'systemParamChanged',
						description: 'Triggers when system parameters change',
					},
					{
						name: 'Vault Created',
						value: 'vaultCreated',
						description: 'Triggers when a new vault is opened',
					},
					{
						name: 'Vault Liquidated',
						value: 'vaultLiquidated',
						description: 'Triggers when a vault is liquidated',
					},
					{
						name: 'Vault Modified',
						value: 'vaultModified',
						description: 'Triggers when a vault is modified',
					},
				],
				default: 'daiTransfer',
			},
			// Filter by address
			{
				displayName: 'Filter by Address',
				name: 'filterAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'Only trigger for events involving this address (leave empty for all)',
				displayOptions: {
					show: {
						event: ['daiTransfer', 'mkrTransfer', 'daiLargeTransfer', 'vaultCreated', 'vaultModified', 'sdaiDeposit', 'sdaiWithdrawal'],
					},
				},
			},
			// Large transfer threshold
			{
				displayName: 'Minimum Amount',
				name: 'minAmount',
				type: 'number',
				default: 100000,
				description: 'Minimum transfer amount to trigger (in DAI/MKR)',
				displayOptions: {
					show: {
						event: ['daiLargeTransfer'],
					},
				},
			},
			// Vault ID filter
			{
				displayName: 'Vault ID',
				name: 'vaultId',
				type: 'number',
				default: 0,
				description: 'Only trigger for this specific vault (0 for all vaults)',
				displayOptions: {
					show: {
						event: ['vaultModified', 'vaultLiquidated'],
					},
				},
			},
			// Collateral type filter
			{
				displayName: 'Collateral Type',
				name: 'ilkFilter',
				type: 'options',
				options: [
					{ name: 'All Collaterals', value: 'all' },
					{ name: 'ETH-A', value: 'ETH-A' },
					{ name: 'ETH-B', value: 'ETH-B' },
					{ name: 'ETH-C', value: 'ETH-C' },
					{ name: 'WBTC-A', value: 'WBTC-A' },
					{ name: 'WSTETH-A', value: 'WSTETH-A' },
					{ name: 'RETH-A', value: 'RETH-A' },
				],
				default: 'all',
				description: 'Filter by collateral type',
				displayOptions: {
					show: {
						event: ['vaultCreated', 'vaultModified', 'vaultLiquidated', 'priceUpdated'],
					},
				},
			},
			// Poll interval
			{
				displayName: 'Poll Interval',
				name: 'pollInterval',
				type: 'number',
				default: 60,
				description: 'How often to check for new events (in seconds)',
			},
		],
	};

	async poll(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const event = this.getNodeParameter('event') as string;
		const pollInterval = this.getNodeParameter('pollInterval', 60) as number;
		
		// Get credentials
		const credentials = await this.getCredentials('makerNetwork');
		const network = credentials.network as string;
		const rpcUrl = (credentials.customRpcUrl as string) || 
			(credentials.rpcUrl as string) || 
			DEFAULT_RPC_URLS[network] || 
			DEFAULT_RPC_URLS.mainnet;
		
		const provider = new JsonRpcProvider(rpcUrl);
		
		// Get the last processed block from workflow static data
		const workflowStaticData = this.getWorkflowStaticData('node');
		let lastBlock = workflowStaticData.lastBlock as number | undefined;
		
		// If no last block, start from current block - 100
		if (!lastBlock) {
			const currentBlock = await provider.getBlockNumber();
			lastBlock = currentBlock - 100;
		}
		
		const currentBlock = await provider.getBlockNumber();
		
		// Don't process if no new blocks
		if (currentBlock <= lastBlock) {
			return {
				workflowData: [],
			};
		}
		
		// Limit block range to prevent timeout
		const fromBlock = lastBlock + 1;
		const toBlock = Math.min(currentBlock, fromBlock + 1000);
		
		let events: IDataObject[] = [];
		
		try {
			switch (event) {
				case 'daiTransfer':
				case 'daiLargeTransfer': {
					events = await this.getDaiTransferEvents(provider, fromBlock, toBlock);
					break;
				}
				case 'mkrTransfer': {
					events = await this.getMkrTransferEvents(provider, fromBlock, toBlock);
					break;
				}
				case 'sdaiDeposit':
				case 'sdaiWithdrawal': {
					events = await this.getSdaiEvents(provider, fromBlock, toBlock, event);
					break;
				}
				case 'vaultCreated':
				case 'vaultModified': {
					events = await this.getVaultEvents(provider, fromBlock, toBlock);
					break;
				}
				default: {
					// For unimplemented events, just update the block
					events = [];
				}
			}
		} catch (error) {
			// Log error but don't fail - just skip this poll
			console.error('Error polling for events:', error);
			events = [];
		}
		
		// Apply filters
		events = this.applyFilters(events, event);
		
		// Update last processed block
		workflowStaticData.lastBlock = toBlock;
		
		// Return events
		if (events.length === 0) {
			return {
				workflowData: [],
			};
		}
		
		return {
			workflowData: [events.map(e => ({ json: e }))],
		};
	}

	/**
	 * Get DAI transfer events
	 */
	private async getDaiTransferEvents(
		this: ITriggerFunctions,
		provider: JsonRpcProvider,
		fromBlock: number,
		toBlock: number
	): Promise<IDataObject[]> {
		const dai = new Contract(MAINNET_CONTRACTS.dai, ERC20_ABI, provider);
		const filter = dai.filters.Transfer();
		
		const logs = await dai.queryFilter(filter, fromBlock, toBlock);
		
		return logs.map(log => {
			const parsed = dai.interface.parseLog({
				topics: log.topics as string[],
				data: log.data,
			});
			
			return {
				event: 'DAI Transfer',
				from: parsed?.args[0],
				to: parsed?.args[1],
				amount: fromWad(parsed?.args[2]).toString(),
				amountRaw: parsed?.args[2].toString(),
				blockNumber: log.blockNumber,
				transactionHash: log.transactionHash,
				timestamp: new Date().toISOString(),
			};
		});
	}

	/**
	 * Get MKR transfer events
	 */
	private async getMkrTransferEvents(
		this: ITriggerFunctions,
		provider: JsonRpcProvider,
		fromBlock: number,
		toBlock: number
	): Promise<IDataObject[]> {
		const mkr = new Contract(MAINNET_CONTRACTS.mkr, ERC20_ABI, provider);
		const filter = mkr.filters.Transfer();
		
		const logs = await mkr.queryFilter(filter, fromBlock, toBlock);
		
		return logs.map(log => {
			const parsed = mkr.interface.parseLog({
				topics: log.topics as string[],
				data: log.data,
			});
			
			return {
				event: 'MKR Transfer',
				from: parsed?.args[0],
				to: parsed?.args[1],
				amount: fromWad(parsed?.args[2]).toString(),
				amountRaw: parsed?.args[2].toString(),
				blockNumber: log.blockNumber,
				transactionHash: log.transactionHash,
				timestamp: new Date().toISOString(),
			};
		});
	}

	/**
	 * Get sDAI events
	 */
	private async getSdaiEvents(
		this: ITriggerFunctions,
		provider: JsonRpcProvider,
		fromBlock: number,
		toBlock: number,
		eventType: string
	): Promise<IDataObject[]> {
		const sdaiAbi = [
			'event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)',
			'event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)',
		];
		
		const sdai = new Contract(MAINNET_CONTRACTS.sdai, sdaiAbi, provider);
		
		const filter = eventType === 'sdaiDeposit' 
			? sdai.filters.Deposit()
			: sdai.filters.Withdraw();
		
		const logs = await sdai.queryFilter(filter, fromBlock, toBlock);
		
		return logs.map(log => {
			const parsed = sdai.interface.parseLog({
				topics: log.topics as string[],
				data: log.data,
			});
			
			if (eventType === 'sdaiDeposit') {
				return {
					event: 'sDAI Deposit',
					sender: parsed?.args[0],
					owner: parsed?.args[1],
					daiAmount: fromWad(parsed?.args[2]).toString(),
					sdaiShares: fromWad(parsed?.args[3]).toString(),
					blockNumber: log.blockNumber,
					transactionHash: log.transactionHash,
					timestamp: new Date().toISOString(),
				};
			} else {
				return {
					event: 'sDAI Withdrawal',
					sender: parsed?.args[0],
					receiver: parsed?.args[1],
					owner: parsed?.args[2],
					daiAmount: fromWad(parsed?.args[3]).toString(),
					sdaiShares: fromWad(parsed?.args[4]).toString(),
					blockNumber: log.blockNumber,
					transactionHash: log.transactionHash,
					timestamp: new Date().toISOString(),
				};
			}
		});
	}

	/**
	 * Get vault events from CDP Manager
	 */
	private async getVaultEvents(
		this: ITriggerFunctions,
		provider: JsonRpcProvider,
		fromBlock: number,
		toBlock: number
	): Promise<IDataObject[]> {
		const cdpManagerAbi = [
			'event NewCdp(address indexed usr, address indexed own, uint256 indexed cdp)',
		];
		
		const cdpManager = new Contract(MAINNET_CONTRACTS.cdpManager, cdpManagerAbi, provider);
		const filter = cdpManager.filters.NewCdp();
		
		const logs = await cdpManager.queryFilter(filter, fromBlock, toBlock);
		
		return logs.map(log => {
			const parsed = cdpManager.interface.parseLog({
				topics: log.topics as string[],
				data: log.data,
			});
			
			return {
				event: 'Vault Created',
				user: parsed?.args[0],
				owner: parsed?.args[1],
				vaultId: parsed?.args[2].toString(),
				blockNumber: log.blockNumber,
				transactionHash: log.transactionHash,
				timestamp: new Date().toISOString(),
			};
		});
	}

	/**
	 * Apply user-defined filters to events
	 */
	private applyFilters(
		this: ITriggerFunctions,
		events: IDataObject[],
		eventType: string
	): IDataObject[] {
		let filtered = events;
		
		// Filter by address
		try {
			const filterAddress = this.getNodeParameter('filterAddress', '') as string;
			if (filterAddress) {
				const lowerAddress = filterAddress.toLowerCase();
				filtered = filtered.filter(e => 
					(e.from as string)?.toLowerCase() === lowerAddress ||
					(e.to as string)?.toLowerCase() === lowerAddress ||
					(e.owner as string)?.toLowerCase() === lowerAddress ||
					(e.sender as string)?.toLowerCase() === lowerAddress ||
					(e.receiver as string)?.toLowerCase() === lowerAddress
				);
			}
		} catch {
			// Parameter not available for this event type
		}
		
		// Filter large transfers
		if (eventType === 'daiLargeTransfer') {
			const minAmount = this.getNodeParameter('minAmount', 100000) as number;
			filtered = filtered.filter(e => parseFloat(e.amount as string) >= minAmount);
		}
		
		// Filter by vault ID
		try {
			const vaultId = this.getNodeParameter('vaultId', 0) as number;
			if (vaultId > 0) {
				filtered = filtered.filter(e => parseInt(e.vaultId as string) === vaultId);
			}
		} catch {
			// Parameter not available for this event type
		}
		
		// Filter by collateral type
		try {
			const ilkFilter = this.getNodeParameter('ilkFilter', 'all') as string;
			if (ilkFilter !== 'all') {
				filtered = filtered.filter(e => e.ilk === ilkFilter || e.collateralType === ilkFilter);
			}
		} catch {
			// Parameter not available for this event type
		}
		
		return filtered;
	}
}
