/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * MakerNetwork credentials for connecting to Ethereum networks
 * Supports multiple networks including Ethereum Mainnet, testnets, and L2s
 */
export class MakerNetwork implements ICredentialType {
	name = 'makerNetwork';
	displayName = 'Maker Network';
	documentationUrl = 'https://docs.makerdao.com/';
	
	properties: INodeProperties[] = [
		{
			displayName: 'Network',
			name: 'network',
			type: 'options',
			options: [
				{
					name: 'Ethereum Mainnet',
					value: 'mainnet',
				},
				{
					name: 'Ethereum Goerli (Testnet)',
					value: 'goerli',
				},
				{
					name: 'Ethereum Sepolia (Testnet)',
					value: 'sepolia',
				},
				{
					name: 'Arbitrum One',
					value: 'arbitrum',
				},
				{
					name: 'Optimism',
					value: 'optimism',
				},
				{
					name: 'Polygon',
					value: 'polygon',
				},
				{
					name: 'Base',
					value: 'base',
				},
				{
					name: 'Gnosis Chain (xDAI)',
					value: 'gnosis',
				},
				{
					name: 'Custom Endpoint',
					value: 'custom',
				},
			],
			default: 'mainnet',
			description: 'The network to connect to',
		},
		{
			displayName: 'RPC Endpoint URL',
			name: 'rpcUrl',
			type: 'string',
			default: '',
			placeholder: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
			description: 'The RPC endpoint URL for the network. Leave empty for default public endpoints.',
			displayOptions: {
				show: {
					network: ['custom'],
				},
			},
		},
		{
			displayName: 'Chain ID',
			name: 'chainId',
			type: 'number',
			default: 1,
			description: 'The chain ID for the network',
			displayOptions: {
				show: {
					network: ['custom'],
				},
			},
		},
		{
			displayName: 'Private Key',
			name: 'privateKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			placeholder: '0x...',
			description: 'Your wallet private key for signing transactions. Never share this key!',
		},
		{
			displayName: 'DSProxy Address',
			name: 'dsProxyAddress',
			type: 'string',
			default: '',
			placeholder: '0x...',
			description: 'Optional: Your DSProxy contract address for Maker vault operations',
		},
		{
			displayName: 'Use Public RPC',
			name: 'usePublicRpc',
			type: 'boolean',
			default: true,
			description: 'Whether to use default public RPC endpoints',
			displayOptions: {
				hide: {
					network: ['custom'],
				},
			},
		},
		{
			displayName: 'Custom RPC URL',
			name: 'customRpcUrl',
			type: 'string',
			default: '',
			placeholder: 'https://your-rpc-provider.com',
			description: 'Custom RPC URL to use instead of public endpoints',
			displayOptions: {
				show: {
					usePublicRpc: [false],
				},
				hide: {
					network: ['custom'],
				},
			},
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.rpcUrl || "https://eth.llamarpc.com"}}',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				jsonrpc: '2.0',
				method: 'eth_chainId',
				params: [],
				id: 1,
			}),
		},
	};
}
