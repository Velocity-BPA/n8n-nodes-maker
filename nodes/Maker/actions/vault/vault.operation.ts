/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createMcdClient } from '../transport/mcdClient';

export const vaultOperations: INodeProperties[] = [
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
			{
				name: 'Get Vault Info',
				value: 'getVaultInfo',
				description: 'Get information about a specific vault',
				action: 'Get vault info',
			},
			{
				name: 'Get Vaults by Owner',
				value: 'getVaultsByOwner',
				description: 'Get all vaults owned by an address',
				action: 'Get vaults by owner',
			},
		],
		default: 'getVaultInfo',
	},
];

export const vaultFields: INodeProperties[] = [
	{
		displayName: 'Vault ID',
		name: 'vaultId',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['vault'],
				operation: ['getVaultInfo'],
			},
		},
		default: 0,
		description: 'The CDP/Vault ID number',
	},
	{
		displayName: 'Owner Address',
		name: 'ownerAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['vault'],
				operation: ['getVaultsByOwner'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The address that owns the vaults',
	},
];

export async function executeVaultOperation(
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
		case 'getVaultInfo': {
			const vaultId = this.getNodeParameter('vaultId', index) as number;
			const vaultInfo = await client.getVaultInfo(vaultId);
			result = {
				vaultId,
				...vaultInfo,
			};
			break;
		}

		case 'getVaultsByOwner': {
			const ownerAddress = this.getNodeParameter('ownerAddress', index) as string;
			const vaults = await client.getVaultsByOwner(ownerAddress);
			return vaults.map(vault => ({ json: vault }));
		}
	}

	return [{ json: result }];
}
