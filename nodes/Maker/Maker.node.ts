/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { ethers } from 'ethers';

import { createMcdClient, McdClient, ERC20_ABI } from './transport/mcdClient';
import { createSubgraphClient, SubgraphClient } from './transport/subgraphClient';
import { MAINNET_CONTRACTS } from './constants/contracts';
import { getIlkBytes32, getSupportedIlks, getIlkInfo } from './constants/ilks';
import { 
	fromWad, 
	fromRay, 
	fromRad, 
	toWad, 
	perSecondToAnnualRate,
	WAD,
	RAY,
	RAD,
} from './utils/mathUtils';
import { 
	calculateActualDebt, 
	formatVaultStatus,
} from './utils/vaultUtils';
import { 
	calculateCurrentChi, 
	pieToDai,
	calculateDsrApy,
} from './utils/dsrUtils';

// Licensing notice - logged once per node load
const LICENSING_NOTICE_LOGGED = Symbol.for('n8n-nodes-maker-licensing-logged');
if (!(globalThis as Record<symbol, boolean>)[LICENSING_NOTICE_LOGGED]) {
	console.warn(`[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
`);
	(globalThis as Record<symbol, boolean>)[LICENSING_NOTICE_LOGGED] = true;
}

export class Maker implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Maker',
		name: 'maker',
		icon: 'file:maker.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Maker/Sky Protocol - DAI, USDS, MKR, vaults, DSR, sDAI, PSM, governance, and more',
		defaults: {
			name: 'Maker',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'makerNetwork',
				required: true,
			},
			{
				name: 'subgraph',
				required: false,
			},
		],
		properties: [
			// Resource Selection
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Analytics', value: 'analytics' },
					{ name: 'Collateral', value: 'collateral' },
					{ name: 'DAI', value: 'dai' },
					{ name: 'DSR (DAI Savings Rate)', value: 'dsr' },
					{ name: 'Governance', value: 'governance' },
					{ name: 'Liquidation', value: 'liquidation' },
					{ name: 'MKR', value: 'mkr' },
					{ name: 'Oracle', value: 'oracle' },
					{ name: 'PSM (Peg Stability Module)', value: 'psm' },
					{ name: 'sDAI (Savings DAI)', value: 'sdai' },
					{ name: 'SKY', value: 'sky' },
					{ name: 'SSR (Sky Savings Rate)', value: 'ssr' },
					{ name: 'System', value: 'system' },
					{ name: 'USDS', value: 'usds' },
					{ name: 'Utility', value: 'utility' },
					{ name: 'Vault', value: 'vault' },
				],
				default: 'dai',
			},

			// ==================
			// DAI Operations
			// ==================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['dai'],
					},
				},
				options: [
					{ name: 'Approve Spending', value: 'approve' },
					{ name: 'Get Allowance', value: 'getAllowance' },
					{ name: 'Get Balance', value: 'getBalance' },
					{ name: 'Get Contract Address', value: 'getContractAddress' },
					{ name: 'Get Price', value: 'getPrice' },
					{ name: 'Get Total Supply', value: 'getTotalSupply' },
					{ name: 'Get Transfer History', value: 'getTransferHistory' },
					{ name: 'Transfer', value: 'transfer' },
				],
				default: 'getBalance',
			},

			// ==================
			// USDS Operations
			// ==================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['usds'],
					},
				},
				options: [
					{ name: 'Approve Spending', value: 'approve' },
					{ name: 'Convert DAI to USDS', value: 'convertFromDai' },
					{ name: 'Convert USDS to DAI', value: 'convertToDai' },
					{ name: 'Get Allowance', value: 'getAllowance' },
					{ name: 'Get Balance', value: 'getBalance' },
					{ name: 'Get Contract Address', value: 'getContractAddress' },
					{ name: 'Get Total Supply', value: 'getTotalSupply' },
					{ name: 'Transfer', value: 'transfer' },
				],
				default: 'getBalance',
			},

			// ==================
			// MKR Operations
			// ==================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['mkr'],
					},
				},
				options: [
					{ name: 'Approve Spending', value: 'approve' },
					{ name: 'Delegate', value: 'delegate' },
					{ name: 'Get Balance', value: 'getBalance' },
					{ name: 'Get Burn History', value: 'getBurnHistory' },
					{ name: 'Get Price', value: 'getPrice' },
					{ name: 'Get Total Supply', value: 'getTotalSupply' },
					{ name: 'Transfer', value: 'transfer' },
				],
				default: 'getBalance',
			},

			// ==================
			// SKY Operations
			// ==================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['sky'],
					},
				},
				options: [
					{ name: 'Convert MKR to SKY', value: 'convertFromMkr' },
					{ name: 'Get Balance', value: 'getBalance' },
					{ name: 'Get Price', value: 'getPrice' },
					{ name: 'Get Total Supply', value: 'getTotalSupply' },
					{ name: 'Transfer', value: 'transfer' },
				],
				default: 'getBalance',
			},

			// ==================
			// DSR Operations
			// ==================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['dsr'],
					},
				},
				options: [
					{ name: 'Calculate Earnings', value: 'calculateEarnings' },
					{ name: 'Deposit DAI', value: 'deposit' },
					{ name: 'Get Balance', value: 'getBalance' },
					{ name: 'Get Chi Value', value: 'getChi' },
					{ name: 'Get Current Rate', value: 'getRate' },
					{ name: 'Get DSR APY', value: 'getApy' },
					{ name: 'Get Total DAI in DSR', value: 'getTotalDai' },
					{ name: 'Withdraw DAI', value: 'withdraw' },
				],
				default: 'getRate',
			},

			// ==================
			// SSR Operations
			// ==================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['ssr'],
					},
				},
				options: [
					{ name: 'Deposit USDS', value: 'deposit' },
					{ name: 'Get Balance', value: 'getBalance' },
					{ name: 'Get Current Rate', value: 'getRate' },
					{ name: 'Get SSR APY', value: 'getApy' },
					{ name: 'Get Total USDS in SSR', value: 'getTotalUsds' },
					{ name: 'Withdraw USDS', value: 'withdraw' },
				],
				default: 'getRate',
			},

			// ==================
			// sDAI Operations
			// ==================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['sdai'],
					},
				},
				options: [
					{ name: 'Approve', value: 'approve' },
					{ name: 'Convert sDAI to DAI Value', value: 'convertToDai' },
					{ name: 'Deposit DAI (Mint sDAI)', value: 'deposit' },
					{ name: 'Get APY', value: 'getApy' },
					{ name: 'Get Balance', value: 'getBalance' },
					{ name: 'Get Exchange Rate', value: 'getExchangeRate' },
					{ name: 'Get Total Supply', value: 'getTotalSupply' },
					{ name: 'Preview Deposit', value: 'previewDeposit' },
					{ name: 'Preview Withdraw', value: 'previewWithdraw' },
					{ name: 'Transfer', value: 'transfer' },
					{ name: 'Withdraw DAI (Redeem sDAI)', value: 'withdraw' },
				],
				default: 'getBalance',
			},

			// ==================
			// Vault Operations
			// ==================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['vault'],
					},
				},
				options: [
					{ name: 'Deposit Collateral', value: 'depositCollateral' },
					{ name: 'Generate DAI', value: 'generateDai' },
					{ name: 'Get Available to Generate', value: 'getAvailableToGenerate' },
					{ name: 'Get Available to Withdraw', value: 'getAvailableToWithdraw' },
					{ name: 'Get Collateralization Ratio', value: 'getCollateralizationRatio' },
					{ name: 'Get Liquidation Price', value: 'getLiquidationPrice' },
					{ name: 'Get Vault by ID', value: 'getVaultById' },
					{ name: 'Get Vault Info', value: 'getVaultInfo' },
					{ name: 'Get Vaults by Owner', value: 'getVaultsByOwner' },
					{ name: 'Open Vault', value: 'openVault' },
					{ name: 'Repay DAI', value: 'repayDai' },
					{ name: 'Withdraw Collateral', value: 'withdrawCollateral' },
				],
				default: 'getVaultsByOwner',
			},

			// ==================
			// Collateral Operations
			// ==================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['collateral'],
					},
				},
				options: [
					{ name: 'Get Collateral Info', value: 'getCollateralInfo' },
					{ name: 'Get Collateral Parameters', value: 'getCollateralParams' },
					{ name: 'Get Collateral Price', value: 'getCollateralPrice' },
					{ name: 'Get Debt Ceiling', value: 'getDebtCeiling' },
					{ name: 'Get Dust Limit', value: 'getDustLimit' },
					{ name: 'Get Liquidation Ratio', value: 'getLiquidationRatio' },
					{ name: 'Get Stability Fee', value: 'getStabilityFee' },
					{ name: 'Get Supported Collaterals', value: 'getSupportedCollaterals' },
					{ name: 'Get Total Collateral Locked', value: 'getTotalLocked' },
					{ name: 'Get Total DAI Generated', value: 'getTotalDaiGenerated' },
				],
				default: 'getSupportedCollaterals',
			},

			// ==================
			// Liquidation Operations
			// ==================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['liquidation'],
					},
				},
				options: [
					{ name: 'Calculate Liquidation Price', value: 'calculateLiquidationPrice' },
					{ name: 'Get Auction History', value: 'getAuctionHistory' },
					{ name: 'Get Auction Info', value: 'getAuctionInfo' },
					{ name: 'Get Liquidatable Vaults', value: 'getLiquidatableVaults' },
					{ name: 'Get Liquidation Penalty', value: 'getLiquidationPenalty' },
				],
				default: 'getLiquidatableVaults',
			},

			// ==================
			// PSM Operations
			// ==================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['psm'],
					},
				},
				options: [
					{ name: 'Calculate Swap Output', value: 'calculateSwapOutput' },
					{ name: 'Get Available Capacity', value: 'getAvailableCapacity' },
					{ name: 'Get PSM Debt Ceiling', value: 'getDebtCeiling' },
					{ name: 'Get PSM Fee', value: 'getPsmFee' },
					{ name: 'Get PSM Stats', value: 'getPsmStats' },
					{ name: 'Get Supported Gems', value: 'getSupportedGems' },
					{ name: 'Swap DAI to USDC', value: 'swapDaiToUsdc' },
					{ name: 'Swap USDC to DAI', value: 'swapUsdcToDai' },
				],
				default: 'getPsmStats',
			},

			// ==================
			// Oracle Operations
			// ==================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['oracle'],
					},
				},
				options: [
					{ name: 'Check Price Validity', value: 'checkPriceValidity' },
					{ name: 'Get Collateral Price (OSM)', value: 'getOsmPrice' },
					{ name: 'Get Medianizer Price', value: 'getMedianizerPrice' },
					{ name: 'Get Next Price', value: 'getNextPrice' },
					{ name: 'Get Oracle Address', value: 'getOracleAddress' },
					{ name: 'Get Price Update Time', value: 'getPriceUpdateTime' },
					{ name: 'Get Spot Price', value: 'getSpotPrice' },
				],
				default: 'getOsmPrice',
			},

			// ==================
			// Governance Operations
			// ==================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['governance'],
					},
				},
				options: [
					{ name: 'Delegate MKR', value: 'delegateMkr' },
					{ name: 'Get Active Proposals', value: 'getActiveProposals' },
					{ name: 'Get Chief Info', value: 'getChiefInfo' },
					{ name: 'Get Current HAT', value: 'getHat' },
					{ name: 'Get Delegate Info', value: 'getDelegateInfo' },
					{ name: 'Get Governance Stats', value: 'getGovernanceStats' },
					{ name: 'Get Proposal Info', value: 'getProposalInfo' },
					{ name: 'Get Vote History', value: 'getVoteHistory' },
					{ name: 'Get Voting Power', value: 'getVotingPower' },
					{ name: 'Undelegate MKR', value: 'undelegateMkr' },
					{ name: 'Vote on Executive', value: 'voteExecutive' },
					{ name: 'Vote on Poll', value: 'votePoll' },
				],
				default: 'getActiveProposals',
			},

			// ==================
			// System Operations
			// ==================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['system'],
					},
				},
				options: [
					{ name: 'Get Base Stability Fee', value: 'getBaseStabilityFee' },
					{ name: 'Get Emergency Shutdown Status', value: 'getEmergencyShutdownStatus' },
					{ name: 'Get Global Debt Ceiling', value: 'getGlobalDebtCeiling' },
					{ name: 'Get Protocol Revenue', value: 'getProtocolRevenue' },
					{ name: 'Get System Status', value: 'getSystemStatus' },
					{ name: 'Get System Surplus', value: 'getSystemSurplus' },
					{ name: 'Get Total DAI Supply', value: 'getTotalDaiSupply' },
					{ name: 'Get Total System Debt', value: 'getTotalSystemDebt' },
				],
				default: 'getSystemStatus',
			},

			// ==================
			// Analytics Operations
			// ==================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['analytics'],
					},
				},
				options: [
					{ name: 'Get Collateral Distribution', value: 'getCollateralDistribution' },
					{ name: 'Get DAI Supply History', value: 'getDaiSupplyHistory' },
					{ name: 'Get DSR Stats', value: 'getDsrStats' },
					{ name: 'Get Liquidation Stats', value: 'getLiquidationStats' },
					{ name: 'Get Protocol TVL', value: 'getProtocolTvl' },
					{ name: 'Get PSM Stats', value: 'getPsmStats' },
					{ name: 'Get Revenue Analytics', value: 'getRevenueAnalytics' },
					{ name: 'Get Vault Stats', value: 'getVaultStats' },
				],
				default: 'getProtocolTvl',
			},

			// ==================
			// Utility Operations
			// ==================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['utility'],
					},
				},
				options: [
					{ name: 'Calculate Collateralization Ratio', value: 'calculateCollateralizationRatio' },
					{ name: 'Calculate DSR Earnings', value: 'calculateDsrEarnings' },
					{ name: 'Calculate Liquidation Price', value: 'calculateLiquidationPrice' },
					{ name: 'Calculate Stability Fee', value: 'calculateStabilityFee' },
					{ name: 'Convert Units (WAD/RAY/RAD)', value: 'convertUnits' },
					{ name: 'Estimate Gas', value: 'estimateGas' },
					{ name: 'Get Contract Addresses', value: 'getContractAddresses' },
					{ name: 'Get Ilk Identifier', value: 'getIlkIdentifier' },
					{ name: 'Get Transaction History', value: 'getTransactionHistory' },
					{ name: 'Validate Vault ID', value: 'validateVaultId' },
				],
				default: 'getContractAddresses',
			},

			// ==================
			// Common Parameters
			// ==================
			
			// Address parameter (used by many operations)
			{
				displayName: 'Wallet Address',
				name: 'address',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'The wallet address to query',
				displayOptions: {
					show: {
						resource: ['dai', 'usds', 'mkr', 'sky', 'sdai'],
						operation: ['getBalance', 'getAllowance', 'getTransferHistory'],
					},
				},
			},
			{
				displayName: 'Wallet Address',
				name: 'address',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'The wallet address to query DSR balance',
				displayOptions: {
					show: {
						resource: ['dsr', 'ssr'],
						operation: ['getBalance', 'calculateEarnings'],
					},
				},
			},

			// To address (for transfers)
			{
				displayName: 'To Address',
				name: 'toAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'The recipient wallet address',
				displayOptions: {
					show: {
						operation: ['transfer'],
					},
				},
			},

			// Amount parameter
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'string',
				default: '',
				placeholder: '100.5',
				description: 'The amount to transfer/deposit/withdraw',
				displayOptions: {
					show: {
						operation: ['transfer', 'approve', 'deposit', 'withdraw', 'generateDai', 'repayDai', 'depositCollateral', 'withdrawCollateral', 'previewDeposit', 'previewWithdraw'],
					},
				},
			},

			// Spender address (for approvals)
			{
				displayName: 'Spender Address',
				name: 'spenderAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'The address allowed to spend tokens',
				displayOptions: {
					show: {
						operation: ['approve', 'getAllowance'],
					},
				},
			},

			// Vault ID parameter
			{
				displayName: 'Vault ID',
				name: 'vaultId',
				type: 'number',
				default: 0,
				description: 'The vault (CDP) ID',
				displayOptions: {
					show: {
						resource: ['vault'],
						operation: ['getVaultById', 'getVaultInfo', 'depositCollateral', 'withdrawCollateral', 'generateDai', 'repayDai', 'getCollateralizationRatio', 'getLiquidationPrice', 'getAvailableToGenerate', 'getAvailableToWithdraw'],
					},
				},
			},

			// Owner address for vaults
			{
				displayName: 'Owner Address',
				name: 'ownerAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'The vault owner address',
				displayOptions: {
					show: {
						resource: ['vault'],
						operation: ['getVaultsByOwner'],
					},
				},
			},

			// Collateral type (ilk) parameter
			{
				displayName: 'Collateral Type',
				name: 'ilk',
				type: 'options',
				options: [
					{ name: 'ETH-A', value: 'ETH-A' },
					{ name: 'ETH-B', value: 'ETH-B' },
					{ name: 'ETH-C', value: 'ETH-C' },
					{ name: 'WBTC-A', value: 'WBTC-A' },
					{ name: 'WBTC-B', value: 'WBTC-B' },
					{ name: 'WBTC-C', value: 'WBTC-C' },
					{ name: 'WSTETH-A', value: 'WSTETH-A' },
					{ name: 'WSTETH-B', value: 'WSTETH-B' },
					{ name: 'RETH-A', value: 'RETH-A' },
					{ name: 'PSM-USDC-A', value: 'PSM-USDC-A' },
					{ name: 'Custom', value: 'custom' },
				],
				default: 'ETH-A',
				description: 'The collateral type (ilk)',
				displayOptions: {
					show: {
						resource: ['collateral', 'vault', 'oracle'],
						operation: ['getCollateralInfo', 'getCollateralParams', 'getCollateralPrice', 'getDebtCeiling', 'getDustLimit', 'getLiquidationRatio', 'getStabilityFee', 'getTotalLocked', 'getTotalDaiGenerated', 'openVault', 'getOsmPrice', 'getNextPrice', 'getSpotPrice', 'getOracleAddress'],
					},
				},
			},

			// Custom ilk input
			{
				displayName: 'Custom Collateral Type',
				name: 'customIlk',
				type: 'string',
				default: '',
				placeholder: 'ETH-A',
				description: 'Enter custom collateral type identifier',
				displayOptions: {
					show: {
						ilk: ['custom'],
					},
				},
			},

			// PSM gem selection
			{
				displayName: 'Stablecoin',
				name: 'psmGem',
				type: 'options',
				options: [
					{ name: 'USDC', value: 'usdc' },
					{ name: 'GUSD', value: 'gusd' },
					{ name: 'USDP', value: 'usdp' },
				],
				default: 'usdc',
				description: 'The stablecoin to swap',
				displayOptions: {
					show: {
						resource: ['psm'],
					},
				},
			},

			// Unit conversion parameters
			{
				displayName: 'Value',
				name: 'value',
				type: 'string',
				default: '',
				description: 'The value to convert',
				displayOptions: {
					show: {
						resource: ['utility'],
						operation: ['convertUnits'],
					},
				},
			},
			{
				displayName: 'From Unit',
				name: 'fromUnit',
				type: 'options',
				options: [
					{ name: 'Decimal', value: 'decimal' },
					{ name: 'WAD (10^18)', value: 'wad' },
					{ name: 'RAY (10^27)', value: 'ray' },
					{ name: 'RAD (10^45)', value: 'rad' },
				],
				default: 'decimal',
				displayOptions: {
					show: {
						resource: ['utility'],
						operation: ['convertUnits'],
					},
				},
			},
			{
				displayName: 'To Unit',
				name: 'toUnit',
				type: 'options',
				options: [
					{ name: 'Decimal', value: 'decimal' },
					{ name: 'WAD (10^18)', value: 'wad' },
					{ name: 'RAY (10^27)', value: 'ray' },
					{ name: 'RAD (10^45)', value: 'rad' },
				],
				default: 'wad',
				displayOptions: {
					show: {
						resource: ['utility'],
						operation: ['convertUnits'],
					},
				},
			},

			// Calculation parameters
			{
				displayName: 'Collateral Amount',
				name: 'collateralAmount',
				type: 'string',
				default: '',
				description: 'Amount of collateral',
				displayOptions: {
					show: {
						resource: ['utility', 'liquidation'],
						operation: ['calculateCollateralizationRatio', 'calculateLiquidationPrice'],
					},
				},
			},
			{
				displayName: 'Debt Amount',
				name: 'debtAmount',
				type: 'string',
				default: '',
				description: 'Amount of debt (DAI)',
				displayOptions: {
					show: {
						resource: ['utility', 'liquidation'],
						operation: ['calculateCollateralizationRatio', 'calculateLiquidationPrice'],
					},
				},
			},
			{
				displayName: 'Collateral Price',
				name: 'collateralPrice',
				type: 'string',
				default: '',
				description: 'Current price of collateral in USD',
				displayOptions: {
					show: {
						resource: ['utility'],
						operation: ['calculateCollateralizationRatio', 'calculateLiquidationPrice'],
					},
				},
			},
			{
				displayName: 'Liquidation Ratio',
				name: 'liquidationRatio',
				type: 'string',
				default: '1.5',
				description: 'Liquidation ratio (e.g., 1.5 for 150%)',
				displayOptions: {
					show: {
						resource: ['utility'],
						operation: ['calculateLiquidationPrice'],
					},
				},
			},

			// DSR earnings calculation
			{
				displayName: 'Principal Amount',
				name: 'principalAmount',
				type: 'string',
				default: '',
				description: 'Initial deposit amount in DAI',
				displayOptions: {
					show: {
						resource: ['utility'],
						operation: ['calculateDsrEarnings'],
					},
				},
			},
			{
				displayName: 'Days',
				name: 'days',
				type: 'number',
				default: 365,
				description: 'Number of days to calculate earnings for',
				displayOptions: {
					show: {
						resource: ['utility'],
						operation: ['calculateDsrEarnings'],
					},
				},
			},

			// Results limit
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				description: 'Maximum number of results to return',
				displayOptions: {
					show: {
						operation: ['getTransferHistory', 'getVaultsByOwner', 'getAuctionHistory', 'getVoteHistory', 'getDaiSupplyHistory', 'getLiquidatableVaults'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Get credentials
		const credentials = await this.getCredentials('makerNetwork');
		
		// Create MCD client
		const mcdClient = createMcdClient({
			network: credentials.network as string,
			privateKey: credentials.privateKey as string,
			rpcUrl: credentials.rpcUrl as string,
			customRpcUrl: credentials.customRpcUrl as string,
			usePublicRpc: credentials.usePublicRpc as boolean,
		});

		// Get subgraph credentials if available
		let subgraphClient: SubgraphClient | null = null;
		try {
			const subgraphCredentials = await this.getCredentials('subgraph');
			if (subgraphCredentials) {
				subgraphClient = createSubgraphClient({
					subgraphType: subgraphCredentials.subgraphType as string,
					subgraphUrl: subgraphCredentials.subgraphUrl as string,
					apiKey: subgraphCredentials.apiKey as string,
				});
			}
		} catch {
			// Subgraph credentials are optional
		}

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				
				let result: IDataObject = {};

				// ==================
				// DAI Operations
				// ==================
				if (resource === 'dai') {
					result = await this.executeDaiOperation(mcdClient, operation, i);
				}
				// ==================
				// USDS Operations
				// ==================
				else if (resource === 'usds') {
					result = await this.executeUsdsOperation(mcdClient, operation, i);
				}
				// ==================
				// MKR Operations
				// ==================
				else if (resource === 'mkr') {
					result = await this.executeMkrOperation(mcdClient, operation, i);
				}
				// ==================
				// SKY Operations
				// ==================
				else if (resource === 'sky') {
					result = await this.executeSkyOperation(mcdClient, operation, i);
				}
				// ==================
				// DSR Operations
				// ==================
				else if (resource === 'dsr') {
					result = await this.executeDsrOperation(mcdClient, operation, i);
				}
				// ==================
				// sDAI Operations
				// ==================
				else if (resource === 'sdai') {
					result = await this.executeSdaiOperation(mcdClient, operation, i);
				}
				// ==================
				// Vault Operations
				// ==================
				else if (resource === 'vault') {
					result = await this.executeVaultOperation(mcdClient, subgraphClient, operation, i);
				}
				// ==================
				// Collateral Operations
				// ==================
				else if (resource === 'collateral') {
					result = await this.executeCollateralOperation(mcdClient, operation, i);
				}
				// ==================
				// System Operations
				// ==================
				else if (resource === 'system') {
					result = await this.executeSystemOperation(mcdClient, operation, i);
				}
				// ==================
				// Utility Operations
				// ==================
				else if (resource === 'utility') {
					result = await this.executeUtilityOperation(mcdClient, operation, i);
				}
				// ==================
				// Analytics Operations
				// ==================
				else if (resource === 'analytics') {
					result = await this.executeAnalyticsOperation(mcdClient, subgraphClient, operation, i);
				}
				// ==================
				// PSM Operations
				// ==================
				else if (resource === 'psm') {
					result = await this.executePsmOperation(mcdClient, operation, i);
				}
				else {
					throw new NodeOperationError(this.getNode(), `Resource "${resource}" is not yet implemented`);
				}

				returnData.push({ json: result });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}

	// Helper method to get ilk name
	private getIlkName(index: number): string {
		const ilk = this.getNodeParameter('ilk', index) as string;
		if (ilk === 'custom') {
			return this.getNodeParameter('customIlk', index) as string;
		}
		return ilk;
	}

	// ==================
	// DAI Operations Implementation
	// ==================
	private async executeDaiOperation(
		this: IExecuteFunctions,
		client: McdClient,
		operation: string,
		index: number
	): Promise<IDataObject> {
		switch (operation) {
			case 'getBalance': {
				const address = this.getNodeParameter('address', index) as string;
				const balance = await client.getDaiBalance(address);
				return {
					address,
					balance: balance.formatted,
					balanceRaw: balance.balance.toString(),
					decimals: balance.decimals,
					symbol: balance.symbol,
				};
			}
			case 'getTotalSupply': {
				const dai = client.getDaiContract();
				const totalSupply = await dai.totalSupply();
				return {
					totalSupply: fromWad(totalSupply).toString(),
					totalSupplyRaw: totalSupply.toString(),
				};
			}
			case 'getContractAddress': {
				const contracts = client.getContracts();
				return {
					address: contracts.dai || MAINNET_CONTRACTS.dai,
					network: 'mainnet',
				};
			}
			case 'transfer': {
				const toAddress = this.getNodeParameter('toAddress', index) as string;
				const amount = this.getNodeParameter('amount', index) as string;
				const amountWad = toWad(parseFloat(amount));
				
				const tx = await client.transferToken(
					client.getContracts().dai || MAINNET_CONTRACTS.dai,
					toAddress,
					amountWad
				);
				
				return {
					transactionHash: tx.hash,
					to: toAddress,
					amount,
					status: 'pending',
				};
			}
			case 'approve': {
				const spenderAddress = this.getNodeParameter('spenderAddress', index) as string;
				const amount = this.getNodeParameter('amount', index) as string;
				const amountWad = toWad(parseFloat(amount));
				
				const tx = await client.approveToken(
					client.getContracts().dai || MAINNET_CONTRACTS.dai,
					spenderAddress,
					amountWad
				);
				
				return {
					transactionHash: tx.hash,
					spender: spenderAddress,
					amount,
					status: 'pending',
				};
			}
			case 'getAllowance': {
				const address = this.getNodeParameter('address', index) as string;
				const spenderAddress = this.getNodeParameter('spenderAddress', index) as string;
				const dai = client.getDaiContract();
				const allowance = await dai.allowance(address, spenderAddress);
				return {
					owner: address,
					spender: spenderAddress,
					allowance: fromWad(allowance).toString(),
					allowanceRaw: allowance.toString(),
				};
			}
			case 'getPrice': {
				// DAI is pegged to $1, but we can get the actual market price via oracle
				return {
					price: '1.00',
					currency: 'USD',
					note: 'DAI is pegged to $1 USD',
				};
			}
			default:
				throw new NodeOperationError(this.getNode(), `Operation "${operation}" is not implemented for DAI`);
		}
	}

	// ==================
	// USDS Operations Implementation
	// ==================
	private async executeUsdsOperation(
		this: IExecuteFunctions,
		client: McdClient,
		operation: string,
		index: number
	): Promise<IDataObject> {
		switch (operation) {
			case 'getBalance': {
				const address = this.getNodeParameter('address', index) as string;
				const usds = client.getUsdsContract();
				const [balance, decimals, symbol] = await Promise.all([
					usds.balanceOf(address),
					usds.decimals(),
					usds.symbol(),
				]);
				return {
					address,
					balance: ethers.formatUnits(balance, decimals),
					balanceRaw: balance.toString(),
					decimals,
					symbol,
				};
			}
			case 'getTotalSupply': {
				const usds = client.getUsdsContract();
				const totalSupply = await usds.totalSupply();
				return {
					totalSupply: fromWad(totalSupply).toString(),
					totalSupplyRaw: totalSupply.toString(),
				};
			}
			case 'getContractAddress': {
				const contracts = client.getContracts();
				return {
					address: contracts.usds || MAINNET_CONTRACTS.usds,
					network: 'mainnet',
				};
			}
			default:
				throw new NodeOperationError(this.getNode(), `Operation "${operation}" is not implemented for USDS`);
		}
	}

	// ==================
	// MKR Operations Implementation
	// ==================
	private async executeMkrOperation(
		this: IExecuteFunctions,
		client: McdClient,
		operation: string,
		index: number
	): Promise<IDataObject> {
		switch (operation) {
			case 'getBalance': {
				const address = this.getNodeParameter('address', index) as string;
				const balance = await client.getMkrBalance(address);
				return {
					address,
					balance: balance.formatted,
					balanceRaw: balance.balance.toString(),
					decimals: balance.decimals,
					symbol: balance.symbol,
				};
			}
			case 'getTotalSupply': {
				const mkr = client.getMkrContract();
				const totalSupply = await mkr.totalSupply();
				return {
					totalSupply: fromWad(totalSupply).toString(),
					totalSupplyRaw: totalSupply.toString(),
				};
			}
			default:
				throw new NodeOperationError(this.getNode(), `Operation "${operation}" is not implemented for MKR`);
		}
	}

	// ==================
	// SKY Operations Implementation
	// ==================
	private async executeSkyOperation(
		this: IExecuteFunctions,
		client: McdClient,
		operation: string,
		index: number
	): Promise<IDataObject> {
		switch (operation) {
			case 'getBalance': {
				const address = this.getNodeParameter('address', index) as string;
				const sky = client.getSkyContract();
				const [balance, decimals, symbol] = await Promise.all([
					sky.balanceOf(address),
					sky.decimals(),
					sky.symbol(),
				]);
				return {
					address,
					balance: ethers.formatUnits(balance, decimals),
					balanceRaw: balance.toString(),
					decimals,
					symbol,
				};
			}
			case 'getTotalSupply': {
				const sky = client.getSkyContract();
				const totalSupply = await sky.totalSupply();
				return {
					totalSupply: fromWad(totalSupply).toString(),
					totalSupplyRaw: totalSupply.toString(),
				};
			}
			default:
				throw new NodeOperationError(this.getNode(), `Operation "${operation}" is not implemented for SKY`);
		}
	}

	// ==================
	// DSR Operations Implementation
	// ==================
	private async executeDsrOperation(
		this: IExecuteFunctions,
		client: McdClient,
		operation: string,
		index: number
	): Promise<IDataObject> {
		switch (operation) {
			case 'getRate': {
				const dsrInfo = await client.getDsrInfo();
				const apy = calculateDsrApy(dsrInfo.dsr);
				return {
					dsr: fromRay(dsrInfo.dsr).toString(),
					dsrRaw: dsrInfo.dsr.toString(),
					apy: apy.toFixed(2) + '%',
					apyDecimal: apy,
				};
			}
			case 'getApy': {
				const dsrInfo = await client.getDsrInfo();
				const apy = calculateDsrApy(dsrInfo.dsr);
				return {
					apy: apy.toFixed(2) + '%',
					apyDecimal: apy,
				};
			}
			case 'getChi': {
				const dsrInfo = await client.getDsrInfo();
				const currentChi = calculateCurrentChi(dsrInfo.chi, dsrInfo.dsr, dsrInfo.rho);
				return {
					chi: fromRay(dsrInfo.chi).toString(),
					chiRaw: dsrInfo.chi.toString(),
					currentChi: fromRay(currentChi).toString(),
					rho: dsrInfo.rho.toString(),
					lastUpdate: new Date(Number(dsrInfo.rho) * 1000).toISOString(),
				};
			}
			case 'getTotalDai': {
				const dsrInfo = await client.getDsrInfo();
				const currentChi = calculateCurrentChi(dsrInfo.chi, dsrInfo.dsr, dsrInfo.rho);
				const totalDai = pieToDai(dsrInfo.Pie, currentChi);
				return {
					totalDai: fromWad(totalDai).toString(),
					totalDaiRaw: totalDai.toString(),
					totalPie: fromWad(dsrInfo.Pie).toString(),
				};
			}
			case 'getBalance': {
				const address = this.getNodeParameter('address', index) as string;
				const [pie, dsrInfo] = await Promise.all([
					client.getDsrBalance(address),
					client.getDsrInfo(),
				]);
				const currentChi = calculateCurrentChi(dsrInfo.chi, dsrInfo.dsr, dsrInfo.rho);
				const daiValue = pieToDai(pie, currentChi);
				return {
					address,
					pie: fromWad(pie).toString(),
					pieRaw: pie.toString(),
					daiValue: fromWad(daiValue).toString(),
					daiValueRaw: daiValue.toString(),
				};
			}
			default:
				throw new NodeOperationError(this.getNode(), `Operation "${operation}" is not implemented for DSR`);
		}
	}

	// ==================
	// sDAI Operations Implementation
	// ==================
	private async executeSdaiOperation(
		this: IExecuteFunctions,
		client: McdClient,
		operation: string,
		index: number
	): Promise<IDataObject> {
		const sdai = client.getSdaiContract();
		
		switch (operation) {
			case 'getBalance': {
				const address = this.getNodeParameter('address', index) as string;
				const balance = await client.getSdaiBalance(address);
				const { rate } = await client.getSdaiExchangeRate();
				const daiValue = parseFloat(balance.formatted) * rate;
				return {
					address,
					sdaiBalance: balance.formatted,
					sdaiBalanceRaw: balance.balance.toString(),
					daiValue: daiValue.toFixed(6),
					exchangeRate: rate.toFixed(8),
				};
			}
			case 'getExchangeRate': {
				const { totalAssets, totalSupply, rate } = await client.getSdaiExchangeRate();
				return {
					exchangeRate: rate.toFixed(8),
					totalAssets: fromWad(totalAssets).toString(),
					totalSupply: fromWad(totalSupply).toString(),
				};
			}
			case 'getTotalSupply': {
				const [totalSupply, totalAssets] = await Promise.all([
					sdai.totalSupply(),
					sdai.totalAssets(),
				]);
				return {
					totalSupply: fromWad(totalSupply).toString(),
					totalSupplyRaw: totalSupply.toString(),
					totalAssets: fromWad(totalAssets).toString(),
					totalAssetsRaw: totalAssets.toString(),
				};
			}
			case 'getApy': {
				const dsrInfo = await client.getDsrInfo();
				const apy = calculateDsrApy(dsrInfo.dsr);
				return {
					apy: apy.toFixed(2) + '%',
					apyDecimal: apy,
					note: 'sDAI APY is based on the DSR rate',
				};
			}
			case 'previewDeposit': {
				const amount = this.getNodeParameter('amount', index) as string;
				const amountWad = toWad(parseFloat(amount));
				const shares = await client.previewSdaiDeposit(amountWad);
				return {
					daiAmount: amount,
					sdaiShares: fromWad(shares).toString(),
					sharesRaw: shares.toString(),
				};
			}
			case 'previewWithdraw': {
				const amount = this.getNodeParameter('amount', index) as string;
				const amountWad = toWad(parseFloat(amount));
				const shares = await client.previewSdaiWithdraw(amountWad);
				return {
					daiAmount: amount,
					sdaiSharesNeeded: fromWad(shares).toString(),
					sharesRaw: shares.toString(),
				};
			}
			case 'convertToDai': {
				const amount = this.getNodeParameter('amount', index) as string;
				const amountWad = toWad(parseFloat(amount));
				const daiAmount = await sdai.convertToAssets(amountWad);
				return {
					sdaiAmount: amount,
					daiValue: fromWad(daiAmount).toString(),
					daiValueRaw: daiAmount.toString(),
				};
			}
			default:
				throw new NodeOperationError(this.getNode(), `Operation "${operation}" is not implemented for sDAI`);
		}
	}

	// ==================
	// Vault Operations Implementation
	// ==================
	private async executeVaultOperation(
		this: IExecuteFunctions,
		client: McdClient,
		subgraphClient: SubgraphClient | null,
		operation: string,
		index: number
	): Promise<IDataObject> {
		switch (operation) {
			case 'getVaultsByOwner': {
				const ownerAddress = this.getNodeParameter('ownerAddress', index) as string;
				const limit = this.getNodeParameter('limit', index, 50) as number;
				
				if (subgraphClient) {
					const { vaults } = await subgraphClient.getVaultsByOwner(ownerAddress, limit);
					return {
						owner: ownerAddress,
						count: vaults.length,
						vaults: vaults.map(v => ({
							id: v.cdpId,
							collateralType: v.collateralType,
							collateral: v.collateral,
							debt: v.debt,
							openedAt: v.openedAt,
						})),
					};
				} else {
					// Use on-chain query
					const vaults = await client.getUserVaults(ownerAddress);
					return {
						owner: ownerAddress,
						count: vaults.ids.length,
						vaults: vaults.ids.map((id, i) => ({
							id: id.toString(),
							urn: vaults.urns[i],
							ilk: vaults.ilks[i],
						})),
					};
				}
			}
			case 'getVaultById': {
				const vaultId = this.getNodeParameter('vaultId', index) as number;
				
				if (subgraphClient) {
					const { vault } = await subgraphClient.getVaultById(vaultId.toString());
					if (!vault) {
						throw new NodeOperationError(this.getNode(), `Vault ${vaultId} not found`);
					}
					return {
						id: vault.cdpId,
						collateralType: vault.collateralType,
						collateral: vault.collateral,
						debt: vault.debt,
						owner: vault.owner,
						openedAt: vault.openedAt,
						updatedAt: vault.updatedAt,
					};
				} else {
					// Use on-chain query via CDP Manager
					const cdpManager = client.getCdpManagerContract();
					const [ilk, urn, owner] = await Promise.all([
						cdpManager.ilks(vaultId),
						cdpManager.urns(vaultId),
						cdpManager.owns(vaultId),
					]);
					
					// Get urn info from VAT
					const vat = client.getVatContract();
					const urnInfo = await vat.urns(ilk, urn);
					const ilkInfo = await vat.ilks(ilk);
					
					const actualDebt = calculateActualDebt(urnInfo[1], ilkInfo[1]);
					
					return {
						id: vaultId,
						ilk: ilk,
						urn: urn,
						owner: owner,
						collateral: fromWad(urnInfo[0]).toString(),
						collateralRaw: urnInfo[0].toString(),
						normalizedDebt: fromWad(urnInfo[1]).toString(),
						actualDebt: fromWad(actualDebt).toString(),
						rate: fromRay(ilkInfo[1]).toString(),
					};
				}
			}
			default:
				throw new NodeOperationError(this.getNode(), `Operation "${operation}" is not implemented for Vault`);
		}
	}

	// ==================
	// Collateral Operations Implementation
	// ==================
	private async executeCollateralOperation(
		this: IExecuteFunctions,
		client: McdClient,
		operation: string,
		index: number
	): Promise<IDataObject> {
		switch (operation) {
			case 'getSupportedCollaterals': {
				const ilks = getSupportedIlks();
				const collaterals = ilks.map(ilk => {
					const info = getIlkInfo(ilk);
					return {
						name: ilk,
						symbol: info?.symbol || ilk.split('-')[0],
						tokenAddress: info?.tokenAddress || 'N/A',
						category: info?.category || 'unknown',
						isActive: info?.isActive || false,
					};
				});
				return {
					count: collaterals.length,
					collaterals,
				};
			}
			case 'getCollateralInfo': {
				const ilkName = this.getIlkName(index);
				const ilkInfo = await client.getIlkInfo(ilkName);
				const staticInfo = getIlkInfo(ilkName);
				
				return {
					ilk: ilkName,
					symbol: staticInfo?.symbol || ilkName.split('-')[0],
					tokenAddress: staticInfo?.tokenAddress || 'N/A',
					totalDebt: fromWad(calculateActualDebt(ilkInfo.Art, ilkInfo.rate)).toString(),
					rate: fromRay(ilkInfo.rate).toString(),
					spot: fromRay(ilkInfo.spot).toString(),
					debtCeiling: fromRad(ilkInfo.line).toString(),
					dustLimit: fromRad(ilkInfo.dust).toString(),
				};
			}
			case 'getStabilityFee': {
				const ilkName = this.getIlkName(index);
				const feeInfo = await client.getStabilityFee(ilkName);
				const baseRate = await client.getBaseStabilityFee();
				
				const totalRate = feeInfo.duty;
				const annualFee = perSecondToAnnualRate(totalRate);
				
				return {
					ilk: ilkName,
					duty: fromRay(feeInfo.duty).toString(),
					dutyRaw: feeInfo.duty.toString(),
					baseRate: fromRay(baseRate).toString(),
					annualFee: annualFee.toFixed(2) + '%',
					annualFeeDecimal: annualFee,
					lastUpdate: new Date(Number(feeInfo.rho) * 1000).toISOString(),
				};
			}
			case 'getDebtCeiling': {
				const ilkName = this.getIlkName(index);
				const ilkInfo = await client.getIlkInfo(ilkName);
				return {
					ilk: ilkName,
					debtCeiling: fromRad(ilkInfo.line).toString(),
					debtCeilingRaw: ilkInfo.line.toString(),
				};
			}
			case 'getDustLimit': {
				const ilkName = this.getIlkName(index);
				const ilkInfo = await client.getIlkInfo(ilkName);
				return {
					ilk: ilkName,
					dustLimit: fromRad(ilkInfo.dust).toString(),
					dustLimitRaw: ilkInfo.dust.toString(),
					note: 'Minimum debt required to open a vault',
				};
			}
			case 'getTotalLocked': {
				const ilkName = this.getIlkName(index);
				const ilkInfo = await client.getIlkInfo(ilkName);
				// Total collateral locked is not directly available from ilks
				// Would need to query all urns or use subgraph
				return {
					ilk: ilkName,
					note: 'Use subgraph for total collateral locked',
				};
			}
			case 'getTotalDaiGenerated': {
				const ilkName = this.getIlkName(index);
				const ilkInfo = await client.getIlkInfo(ilkName);
				const totalDebt = calculateActualDebt(ilkInfo.Art, ilkInfo.rate);
				return {
					ilk: ilkName,
					totalDaiGenerated: fromWad(totalDebt).toString(),
					totalDaiGeneratedRaw: totalDebt.toString(),
					normalizedDebt: fromWad(ilkInfo.Art).toString(),
					rate: fromRay(ilkInfo.rate).toString(),
				};
			}
			default:
				throw new NodeOperationError(this.getNode(), `Operation "${operation}" is not implemented for Collateral`);
		}
	}

	// ==================
	// System Operations Implementation
	// ==================
	private async executeSystemOperation(
		this: IExecuteFunctions,
		client: McdClient,
		operation: string,
		_index: number
	): Promise<IDataObject> {
		switch (operation) {
			case 'getSystemStatus': {
				const [globalDebtCeiling, totalDebt, systemSurplus, dsrInfo, blockNumber] = await Promise.all([
					client.getGlobalDebtCeiling(),
					client.getTotalDebt(),
					client.getSystemSurplus(),
					client.getDsrInfo(),
					client.getBlockNumber(),
				]);
				
				const dsrApy = calculateDsrApy(dsrInfo.dsr);
				
				return {
					globalDebtCeiling: fromRad(globalDebtCeiling).toString(),
					totalDebt: fromRad(totalDebt).toString(),
					systemSurplus: fromRad(systemSurplus).toString(),
					dsrApy: dsrApy.toFixed(2) + '%',
					totalDaiInDsr: fromWad(dsrInfo.Pie).toString(),
					currentBlock: blockNumber,
				};
			}
			case 'getGlobalDebtCeiling': {
				const ceiling = await client.getGlobalDebtCeiling();
				return {
					globalDebtCeiling: fromRad(ceiling).toString(),
					globalDebtCeilingRaw: ceiling.toString(),
				};
			}
			case 'getTotalSystemDebt': {
				const debt = await client.getTotalDebt();
				return {
					totalSystemDebt: fromRad(debt).toString(),
					totalSystemDebtRaw: debt.toString(),
				};
			}
			case 'getSystemSurplus': {
				const surplus = await client.getSystemSurplus();
				return {
					systemSurplus: fromRad(surplus).toString(),
					systemSurplusRaw: surplus.toString(),
				};
			}
			case 'getTotalDaiSupply': {
				const dai = client.getDaiContract();
				const totalSupply = await dai.totalSupply();
				return {
					totalDaiSupply: fromWad(totalSupply).toString(),
					totalDaiSupplyRaw: totalSupply.toString(),
				};
			}
			case 'getBaseStabilityFee': {
				const baseRate = await client.getBaseStabilityFee();
				const annualRate = perSecondToAnnualRate(baseRate);
				return {
					baseStabilityFee: fromRay(baseRate).toString(),
					baseStabilityFeeRaw: baseRate.toString(),
					annualRate: annualRate.toFixed(4) + '%',
				};
			}
			case 'getEmergencyShutdownStatus': {
				const vat = client.getVatContract();
				const live = await vat.live();
				return {
					emergencyShutdown: live === 0n,
					live: live.toString(),
					status: live === 1n ? 'System is active' : 'Emergency shutdown triggered',
				};
			}
			default:
				throw new NodeOperationError(this.getNode(), `Operation "${operation}" is not implemented for System`);
		}
	}

	// ==================
	// Utility Operations Implementation
	// ==================
	private async executeUtilityOperation(
		this: IExecuteFunctions,
		client: McdClient,
		operation: string,
		index: number
	): Promise<IDataObject> {
		switch (operation) {
			case 'getContractAddresses': {
				const contracts = client.getContracts();
				return {
					dai: contracts.dai || MAINNET_CONTRACTS.dai,
					mkr: contracts.mkr || MAINNET_CONTRACTS.mkr,
					usds: contracts.usds || MAINNET_CONTRACTS.usds,
					sky: contracts.sky || MAINNET_CONTRACTS.sky,
					sdai: contracts.sdai || MAINNET_CONTRACTS.sdai,
					vat: contracts.vat || MAINNET_CONTRACTS.vat,
					pot: contracts.pot || MAINNET_CONTRACTS.pot,
					jug: contracts.jug || MAINNET_CONTRACTS.jug,
					spot: contracts.spot || MAINNET_CONTRACTS.spot,
					cdpManager: contracts.cdpManager || MAINNET_CONTRACTS.cdpManager,
					chief: contracts.chief || MAINNET_CONTRACTS.chief,
				};
			}
			case 'convertUnits': {
				const value = this.getNodeParameter('value', index) as string;
				const fromUnit = this.getNodeParameter('fromUnit', index) as string;
				const toUnit = this.getNodeParameter('toUnit', index) as string;
				
				let valueBigInt: bigint;
				
				// Convert from source unit to base
				if (fromUnit === 'decimal') {
					valueBigInt = toWad(parseFloat(value));
				} else if (fromUnit === 'wad') {
					valueBigInt = BigInt(value);
				} else if (fromUnit === 'ray') {
					valueBigInt = BigInt(value) * WAD / RAY;
				} else if (fromUnit === 'rad') {
					valueBigInt = BigInt(value) * WAD / RAD;
				} else {
					valueBigInt = BigInt(value);
				}
				
				// Convert to target unit
				let result: string;
				if (toUnit === 'decimal') {
					result = fromWad(valueBigInt).toString();
				} else if (toUnit === 'wad') {
					result = valueBigInt.toString();
				} else if (toUnit === 'ray') {
					result = (valueBigInt * RAY / WAD).toString();
				} else if (toUnit === 'rad') {
					result = (valueBigInt * RAD / WAD).toString();
				} else {
					result = valueBigInt.toString();
				}
				
				return {
					input: value,
					fromUnit,
					toUnit,
					result,
				};
			}
			case 'getIlkIdentifier': {
				const ilkName = this.getIlkName(index);
				const ilkBytes32 = getIlkBytes32(ilkName);
				return {
					ilkName,
					ilkBytes32,
				};
			}
			case 'estimateGas': {
				const gasPrice = await client.getGasPrice();
				return {
					gasPrice: gasPrice.toString(),
					gasPriceGwei: (Number(gasPrice) / 1e9).toFixed(2),
				};
			}
			case 'calculateDsrEarnings': {
				const principalAmount = this.getNodeParameter('principalAmount', index) as string;
				const days = this.getNodeParameter('days', index) as number;
				
				const dsrInfo = await client.getDsrInfo();
				const apy = calculateDsrApy(dsrInfo.dsr);
				const principal = parseFloat(principalAmount);
				const yearFraction = days / 365;
				const earnings = principal * (Math.pow(1 + apy / 100, yearFraction) - 1);
				
				return {
					principal: principalAmount,
					days,
					currentApy: apy.toFixed(2) + '%',
					estimatedEarnings: earnings.toFixed(6),
					finalBalance: (principal + earnings).toFixed(6),
				};
			}
			default:
				throw new NodeOperationError(this.getNode(), `Operation "${operation}" is not implemented for Utility`);
		}
	}

	// ==================
	// Analytics Operations Implementation
	// ==================
	private async executeAnalyticsOperation(
		this: IExecuteFunctions,
		client: McdClient,
		subgraphClient: SubgraphClient | null,
		operation: string,
		_index: number
	): Promise<IDataObject> {
		switch (operation) {
			case 'getProtocolTvl': {
				const [totalDebt, dsrInfo, sdaiTotalAssets] = await Promise.all([
					client.getTotalDebt(),
					client.getDsrInfo(),
					client.getSdaiContract().totalAssets(),
				]);
				
				return {
					totalDebt: fromRad(totalDebt).toString(),
					daiInDsr: fromWad(dsrInfo.Pie).toString(),
					daiInSdai: fromWad(sdaiTotalAssets).toString(),
					note: 'TVL represents total value locked in the protocol',
				};
			}
			case 'getDsrStats': {
				const dsrInfo = await client.getDsrInfo();
				const apy = calculateDsrApy(dsrInfo.dsr);
				const currentChi = calculateCurrentChi(dsrInfo.chi, dsrInfo.dsr, dsrInfo.rho);
				const totalDai = pieToDai(dsrInfo.Pie, currentChi);
				
				return {
					currentApy: apy.toFixed(2) + '%',
					totalDaiDeposited: fromWad(totalDai).toString(),
					totalPie: fromWad(dsrInfo.Pie).toString(),
					chi: fromRay(currentChi).toString(),
					lastUpdate: new Date(Number(dsrInfo.rho) * 1000).toISOString(),
				};
			}
			case 'getVaultStats': {
				if (subgraphClient) {
					const { systemState } = await subgraphClient.getSystemState();
					return {
						totalDebt: systemState?.totalDebt || '0',
						totalCollateral: systemState?.totalCollateral || '0',
						timestamp: systemState?.timestamp || '0',
					};
				} else {
					const totalDebt = await client.getTotalDebt();
					return {
						totalDebt: fromRad(totalDebt).toString(),
						note: 'Enable subgraph for detailed vault stats',
					};
				}
			}
			default:
				throw new NodeOperationError(this.getNode(), `Operation "${operation}" is not implemented for Analytics`);
		}
	}

	// ==================
	// PSM Operations Implementation
	// ==================
	private async executePsmOperation(
		this: IExecuteFunctions,
		client: McdClient,
		operation: string,
		index: number
	): Promise<IDataObject> {
		const psmGem = this.getNodeParameter('psmGem', index, 'usdc') as string;
		const contracts = client.getContracts();
		
		// Get PSM contract address based on gem
		let psmAddress: string;
		switch (psmGem) {
			case 'usdc':
				psmAddress = contracts.psmUsdc || MAINNET_CONTRACTS.psmUsdc;
				break;
			case 'gusd':
				psmAddress = contracts.psmGusd || MAINNET_CONTRACTS.psmGusd;
				break;
			case 'usdp':
				psmAddress = contracts.psmUsdp || MAINNET_CONTRACTS.psmUsdp;
				break;
			default:
				psmAddress = contracts.psmUsdc || MAINNET_CONTRACTS.psmUsdc;
		}
		
		switch (operation) {
			case 'getPsmStats': {
				const ilkName = `PSM-${psmGem.toUpperCase()}-A`;
				const ilkInfo = await client.getIlkInfo(ilkName);
				const totalDebt = calculateActualDebt(ilkInfo.Art, ilkInfo.rate);
				
				return {
					gem: psmGem.toUpperCase(),
					ilk: ilkName,
					psmAddress,
					totalDaiGenerated: fromWad(totalDebt).toString(),
					debtCeiling: fromRad(ilkInfo.line).toString(),
					utilization: (Number(totalDebt) / Number(ilkInfo.line / RAD * WAD) * 100).toFixed(2) + '%',
				};
			}
			case 'getSupportedGems': {
				return {
					gems: [
						{ symbol: 'USDC', ilk: 'PSM-USDC-A', address: contracts.psmUsdc || MAINNET_CONTRACTS.psmUsdc },
						{ symbol: 'GUSD', ilk: 'PSM-GUSD-A', address: contracts.psmGusd || MAINNET_CONTRACTS.psmGusd },
						{ symbol: 'USDP', ilk: 'PSM-USDP-A', address: contracts.psmUsdp || MAINNET_CONTRACTS.psmUsdp },
					],
				};
			}
			case 'getDebtCeiling': {
				const ilkName = `PSM-${psmGem.toUpperCase()}-A`;
				const ilkInfo = await client.getIlkInfo(ilkName);
				return {
					gem: psmGem.toUpperCase(),
					ilk: ilkName,
					debtCeiling: fromRad(ilkInfo.line).toString(),
					debtCeilingRaw: ilkInfo.line.toString(),
				};
			}
			case 'getAvailableCapacity': {
				const ilkName = `PSM-${psmGem.toUpperCase()}-A`;
				const ilkInfo = await client.getIlkInfo(ilkName);
				const totalDebt = calculateActualDebt(ilkInfo.Art, ilkInfo.rate);
				const ceiling = ilkInfo.line / RAD * WAD;
				const available = ceiling > totalDebt ? ceiling - totalDebt : 0n;
				
				return {
					gem: psmGem.toUpperCase(),
					ilk: ilkName,
					availableCapacity: fromWad(available).toString(),
					totalUsed: fromWad(totalDebt).toString(),
					debtCeiling: fromWad(ceiling).toString(),
				};
			}
			default:
				throw new NodeOperationError(this.getNode(), `Operation "${operation}" is not implemented for PSM`);
		}
	}
}
