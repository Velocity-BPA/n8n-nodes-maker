/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createMcdClient } from '../transport/mcdClient';

export const daiOperations: INodeProperties[] = [
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
			{
				name: 'Get Balance',
				value: 'getBalance',
				description: 'Get DAI balance for an address',
				action: 'Get DAI balance',
			},
			{
				name: 'Transfer',
				value: 'transfer',
				description: 'Transfer DAI to another address',
				action: 'Transfer DAI',
			},
			{
				name: 'Approve Spending',
				value: 'approve',
				description: 'Approve a spender to use DAI',
				action: 'Approve DAI spending',
			},
			{
				name: 'Get Allowance',
				value: 'getAllowance',
				description: 'Get approved DAI allowance',
				action: 'Get DAI allowance',
			},
			{
				name: 'Get Total Supply',
				value: 'getTotalSupply',
				description: 'Get total DAI supply',
				action: 'Get DAI total supply',
			},
			{
				name: 'Get Contract Address',
				value: 'getContractAddress',
				description: 'Get DAI contract address for network',
				action: 'Get DAI contract address',
			},
			{
				name: 'Get Savings Rate',
				value: 'getSavingsRate',
				description: 'Get current DAI Savings Rate (DSR)',
				action: 'Get DAI savings rate',
			},
		],
		default: 'getBalance',
	},
];

export const daiFields: INodeProperties[] = [
	// Get Balance
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['dai'],
				operation: ['getBalance'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The Ethereum address to check balance for',
	},
	// Transfer
	{
		displayName: 'Recipient Address',
		name: 'toAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['dai'],
				operation: ['transfer'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The address to send DAI to',
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['dai'],
				operation: ['transfer', 'approve'],
			},
		},
		default: '',
		placeholder: '100.5',
		description: 'Amount of DAI (in decimal format)',
	},
	// Approve
	{
		displayName: 'Spender Address',
		name: 'spenderAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['dai'],
				operation: ['approve', 'getAllowance'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The address allowed to spend DAI',
	},
	// Get Allowance
	{
		displayName: 'Owner Address',
		name: 'ownerAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['dai'],
				operation: ['getAllowance'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The address that owns the DAI',
	},
];

export async function executeDaiOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('makerNetwork');
	
	const client = createMcdClient({
		network: credentials.network as string,
		rpcUrl: credentials.rpcUrl as string,
		customRpcUrl: credentials.customRpcUrl as string,
		privateKey: credentials.privateKey as string,
		usePublicRpc: credentials.usePublicRpc as boolean,
	});

	let result: Record<string, unknown> = {};

	switch (operation) {
		case 'getBalance': {
			const address = this.getNodeParameter('address', index) as string;
			const balance = await client.getDaiBalance(address);
			result = {
				address,
				balance,
				symbol: 'DAI',
				decimals: 18,
			};
			break;
		}

		case 'transfer': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const txHash = await client.transferDai(toAddress, amount);
			result = {
				success: true,
				transactionHash: txHash,
				to: toAddress,
				amount,
				symbol: 'DAI',
			};
			break;
		}

		case 'approve': {
			const spenderAddress = this.getNodeParameter('spenderAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const txHash = await client.approveDai(spenderAddress, amount);
			result = {
				success: true,
				transactionHash: txHash,
				spender: spenderAddress,
				amount,
				symbol: 'DAI',
			};
			break;
		}

		case 'getAllowance': {
			const ownerAddress = this.getNodeParameter('ownerAddress', index) as string;
			const spenderAddress = this.getNodeParameter('spenderAddress', index) as string;
			const allowance = await client.getDaiAllowance(ownerAddress, spenderAddress);
			result = {
				owner: ownerAddress,
				spender: spenderAddress,
				allowance,
				symbol: 'DAI',
			};
			break;
		}

		case 'getTotalSupply': {
			const totalSupply = await client.getDaiTotalSupply();
			result = {
				totalSupply,
				symbol: 'DAI',
				decimals: 18,
			};
			break;
		}

		case 'getContractAddress': {
			const { MAINNET_CONTRACTS } = await import('../constants/contracts');
			result = {
				network: credentials.network,
				address: MAINNET_CONTRACTS.dai,
				symbol: 'DAI',
				decimals: 18,
			};
			break;
		}

		case 'getSavingsRate': {
			const dsrInfo = await client.getDsrInfo();
			result = {
				dsr: dsrInfo.dsr,
				apy: dsrInfo.apy.toFixed(2) + '%',
				chi: dsrInfo.chi,
				lastUpdate: new Date(dsrInfo.rho * 1000).toISOString(),
			};
			break;
		}
	}

	return [{ json: result }];
}
