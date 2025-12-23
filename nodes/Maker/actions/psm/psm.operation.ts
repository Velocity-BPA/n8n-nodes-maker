/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createMcdClient } from '../transport/mcdClient';
import { MAINNET_CONTRACTS } from '../constants/contracts';

export const psmOperations: INodeProperties[] = [
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
			{
				name: 'Get PSM Info',
				value: 'getPsmInfo',
				description: 'Get PSM (Peg Stability Module) information',
				action: 'Get PSM info',
			},
			{
				name: 'Get USDC PSM Info',
				value: 'getUsdcPsmInfo',
				description: 'Get USDC PSM specific information',
				action: 'Get USDC PSM info',
			},
		],
		default: 'getPsmInfo',
	},
];

export const psmFields: INodeProperties[] = [
	{
		displayName: 'PSM Type',
		name: 'psmType',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['psm'],
				operation: ['getPsmInfo'],
			},
		},
		options: [
			{
				name: 'USDC PSM',
				value: 'usdc',
			},
			{
				name: 'GUSD PSM',
				value: 'gusd',
			},
			{
				name: 'USDP PSM',
				value: 'usdp',
			},
		],
		default: 'usdc',
		description: 'The PSM type to query',
	},
];

export async function executePsmOperation(
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
		case 'getPsmInfo': {
			const psmType = this.getNodeParameter('psmType', index) as string;
			const psmAddresses: Record<string, string> = {
				usdc: MAINNET_CONTRACTS.psmUsdc,
				gusd: MAINNET_CONTRACTS.psmGusd,
				usdp: MAINNET_CONTRACTS.psmUsdp,
			};
			const psmInfo = await client.getPsmInfo(psmAddresses[psmType]);
			result = {
				psmType,
				address: psmAddresses[psmType],
				...psmInfo,
			};
			break;
		}

		case 'getUsdcPsmInfo': {
			const psmInfo = await client.getPsmInfo(MAINNET_CONTRACTS.psmUsdc);
			result = {
				psmType: 'USDC',
				address: MAINNET_CONTRACTS.psmUsdc,
				...psmInfo,
			};
			break;
		}
	}

	return [{ json: result }];
}
