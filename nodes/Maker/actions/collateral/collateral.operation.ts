/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createMcdClient } from '../transport/mcdClient';
import { getSupportedIlks } from '../constants/ilks';

export const collateralOperations: INodeProperties[] = [
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
			{
				name: 'Get Supported Collaterals',
				value: 'getSupportedCollaterals',
				description: 'Get list of supported collateral types',
				action: 'Get supported collaterals',
			},
			{
				name: 'Get Collateral Info',
				value: 'getCollateralInfo',
				description: 'Get information about a collateral type (ilk)',
				action: 'Get collateral info',
			},
		],
		default: 'getSupportedCollaterals',
	},
];

export const collateralFields: INodeProperties[] = [
	{
		displayName: 'Collateral Type (Ilk)',
		name: 'ilk',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['collateral'],
				operation: ['getCollateralInfo'],
			},
		},
		options: getSupportedIlks().map(ilk => ({
			name: ilk,
			value: ilk,
		})),
		default: 'ETH-A',
		description: 'The collateral type identifier',
	},
];

export async function executeCollateralOperation(
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

	switch (operation) {
		case 'getSupportedCollaterals': {
			const ilks = getSupportedIlks();
			return ilks.map(ilk => ({ 
				json: { 
					ilk,
					description: `Collateral type: ${ilk}`,
				} 
			}));
		}

		case 'getCollateralInfo': {
			const ilk = this.getNodeParameter('ilk', index) as string;
			const ilkInfo = await client.getIlkInfo(ilk);
			return [{ 
				json: {
					ilk,
					...ilkInfo,
				}
			}];
		}
	}

	return [];
}
