/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createMcdClient } from '../transport/mcdClient';

export const mkrOperations: INodeProperties[] = [
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
			{
				name: 'Get Balance',
				value: 'getBalance',
				description: 'Get MKR balance for an address',
				action: 'Get MKR balance',
			},
			{
				name: 'Get Total Supply',
				value: 'getTotalSupply',
				description: 'Get total MKR supply',
				action: 'Get MKR total supply',
			},
			{
				name: 'Get Contract Address',
				value: 'getContractAddress',
				description: 'Get MKR contract address',
				action: 'Get MKR contract address',
			},
		],
		default: 'getBalance',
	},
];

export const mkrFields: INodeProperties[] = [
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['mkr'],
				operation: ['getBalance'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The Ethereum address to check MKR balance for',
	},
];

export async function executeMkrOperation(
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
			const balance = await client.getMkrBalance(address);
			result = {
				address,
				balance,
				symbol: 'MKR',
				decimals: 18,
			};
			break;
		}

		case 'getTotalSupply': {
			const totalSupply = await client.getMkrTotalSupply();
			result = {
				totalSupply,
				symbol: 'MKR',
				decimals: 18,
			};
			break;
		}

		case 'getContractAddress': {
			const { MAINNET_CONTRACTS } = await import('../constants/contracts');
			result = {
				network: credentials.network,
				address: MAINNET_CONTRACTS.mkr,
				symbol: 'MKR',
				decimals: 18,
			};
			break;
		}
	}

	return [{ json: result }];
}
