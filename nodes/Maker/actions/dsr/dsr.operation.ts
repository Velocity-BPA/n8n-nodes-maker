/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createMcdClient } from '../transport/mcdClient';

export const dsrOperations: INodeProperties[] = [
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
			{
				name: 'Get Current Rate',
				value: 'getCurrentRate',
				description: 'Get current DAI Savings Rate',
				action: 'Get DSR rate',
			},
			{
				name: 'Get DSR Balance',
				value: 'getDsrBalance',
				description: 'Get DSR balance for an address',
				action: 'Get DSR balance',
			},
			{
				name: 'Get DSR APY',
				value: 'getDsrApy',
				description: 'Get current DSR APY percentage',
				action: 'Get DSR APY',
			},
		],
		default: 'getCurrentRate',
	},
];

export const dsrFields: INodeProperties[] = [
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['dsr'],
				operation: ['getDsrBalance'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The address to check DSR balance for',
	},
];

export async function executeDsrOperation(
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
		case 'getCurrentRate': {
			const dsrInfo = await client.getDsrInfo();
			result = {
				dsr: dsrInfo.dsr,
				chi: dsrInfo.chi,
				apy: dsrInfo.apy.toFixed(2) + '%',
				lastUpdate: new Date(dsrInfo.rho * 1000).toISOString(),
			};
			break;
		}

		case 'getDsrBalance': {
			const address = this.getNodeParameter('address', index) as string;
			const balance = await client.getDsrBalance(address);
			const dsrInfo = await client.getDsrInfo();
			result = {
				address,
				normalizedBalance: balance.pie,
				actualDaiValue: balance.dai,
				currentApy: dsrInfo.apy.toFixed(2) + '%',
			};
			break;
		}

		case 'getDsrApy': {
			const dsrInfo = await client.getDsrInfo();
			result = {
				apy: dsrInfo.apy,
				apyFormatted: dsrInfo.apy.toFixed(2) + '%',
				description: 'Annual Percentage Yield for DAI Savings Rate',
			};
			break;
		}
	}

	return [{ json: result }];
}
