/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createMcdClient } from '../transport/mcdClient';

export const sdaiOperations: INodeProperties[] = [
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
			{
				name: 'Get Balance',
				value: 'getBalance',
				description: 'Get sDAI balance for an address',
				action: 'Get sDAI balance',
			},
			{
				name: 'Get Exchange Rate',
				value: 'getExchangeRate',
				description: 'Get sDAI to DAI exchange rate',
				action: 'Get sDAI exchange rate',
			},
			{
				name: 'Convert to DAI Value',
				value: 'convertToDai',
				description: 'Convert sDAI amount to DAI value',
				action: 'Convert sDAI to DAI value',
			},
			{
				name: 'Preview Deposit',
				value: 'previewDeposit',
				description: 'Preview sDAI received for DAI deposit',
				action: 'Preview sDAI deposit',
			},
			{
				name: 'Get Contract Address',
				value: 'getContractAddress',
				description: 'Get sDAI contract address',
				action: 'Get sDAI contract address',
			},
		],
		default: 'getBalance',
	},
];

export const sdaiFields: INodeProperties[] = [
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['sdai'],
				operation: ['getBalance'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The address to check sDAI balance for',
	},
	{
		displayName: 'sDAI Amount',
		name: 'sdaiAmount',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['sdai'],
				operation: ['convertToDai'],
			},
		},
		default: '',
		placeholder: '100',
		description: 'Amount of sDAI to convert',
	},
	{
		displayName: 'DAI Amount',
		name: 'daiAmount',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['sdai'],
				operation: ['previewDeposit'],
			},
		},
		default: '',
		placeholder: '100',
		description: 'Amount of DAI to deposit',
	},
];

export async function executeSdaiOperation(
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
			const balance = await client.getSdaiBalance(address);
			const exchangeRate = await client.getSdaiExchangeRate();
			const daiValue = (parseFloat(balance) * parseFloat(exchangeRate)).toFixed(6);
			result = {
				address,
				sdaiBalance: balance,
				daiValue,
				exchangeRate,
				symbol: 'sDAI',
			};
			break;
		}

		case 'getExchangeRate': {
			const exchangeRate = await client.getSdaiExchangeRate();
			const dsrInfo = await client.getDsrInfo();
			result = {
				exchangeRate,
				description: `1 sDAI = ${exchangeRate} DAI`,
				currentApy: dsrInfo.apy.toFixed(2) + '%',
			};
			break;
		}

		case 'convertToDai': {
			const sdaiAmount = this.getNodeParameter('sdaiAmount', index) as string;
			const daiValue = await client.convertSdaiToDai(sdaiAmount);
			result = {
				sdaiAmount,
				daiValue,
				symbol: 'DAI',
			};
			break;
		}

		case 'previewDeposit': {
			const daiAmount = this.getNodeParameter('daiAmount', index) as string;
			const sdaiAmount = await client.previewSdaiDeposit(daiAmount);
			result = {
				daiAmount,
				sdaiReceived: sdaiAmount,
				symbol: 'sDAI',
			};
			break;
		}

		case 'getContractAddress': {
			const { MAINNET_CONTRACTS } = await import('../constants/contracts');
			result = {
				network: credentials.network,
				address: MAINNET_CONTRACTS.sdai,
				symbol: 'sDAI',
				standard: 'ERC-4626',
			};
			break;
		}
	}

	return [{ json: result }];
}
