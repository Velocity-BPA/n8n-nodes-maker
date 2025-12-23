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
 * Subgraph credentials for querying Maker protocol data via The Graph
 * Provides access to indexed blockchain data for analytics and monitoring
 */
export class Subgraph implements ICredentialType {
	name = 'subgraph';
	displayName = 'Maker Subgraph';
	documentationUrl = 'https://thegraph.com/docs/';
	
	properties: INodeProperties[] = [
		{
			displayName: 'Subgraph Type',
			name: 'subgraphType',
			type: 'options',
			options: [
				{
					name: 'Maker Protocol (Official)',
					value: 'maker',
				},
				{
					name: 'Maker Governance',
					value: 'governance',
				},
				{
					name: 'DAI Stats',
					value: 'daiStats',
				},
				{
					name: 'Spark Protocol',
					value: 'spark',
				},
				{
					name: 'Custom Subgraph',
					value: 'custom',
				},
			],
			default: 'maker',
			description: 'The subgraph to query',
		},
		{
			displayName: 'Subgraph URL',
			name: 'subgraphUrl',
			type: 'string',
			default: '',
			placeholder: 'https://api.thegraph.com/subgraphs/name/...',
			description: 'The custom subgraph URL',
			displayOptions: {
				show: {
					subgraphType: ['custom'],
				},
			},
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'The Graph API key (required for decentralized network)',
		},
		{
			displayName: 'Use Decentralized Network',
			name: 'useDecentralized',
			type: 'boolean',
			default: false,
			description: 'Whether to use The Graph decentralized network (requires API key)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.thegraph.com/subgraphs/name/makerdao/makerdao',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				query: '{ _meta { block { number } } }',
			}),
		},
	};
}
