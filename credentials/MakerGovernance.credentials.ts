/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * MakerGovernance credentials for interacting with Maker governance
 * Used for voting on proposals and managing governance participation
 */
export class MakerGovernance implements ICredentialType {
	name = 'makerGovernance';
	displayName = 'Maker Governance';
	documentationUrl = 'https://vote.makerdao.com/';
	
	properties: INodeProperties[] = [
		{
			displayName: 'Voting Proxy Address',
			name: 'votingProxyAddress',
			type: 'string',
			default: '',
			placeholder: '0x...',
			description: 'Your voting proxy contract address (if using vote proxy)',
		},
		{
			displayName: 'Chief Contract Address',
			name: 'chiefAddress',
			type: 'string',
			default: '0x0a3f6849f78076aefadf113f5bed87720274ddc0',
			description: 'The DSChief contract address for governance voting',
		},
		{
			displayName: 'IOU Token Address',
			name: 'iouTokenAddress',
			type: 'string',
			default: '0x496C67A4CEd9C453A60F3166AB4B329870c8E355',
			description: 'The IOU token contract address representing locked MKR',
		},
		{
			displayName: 'Polling Contract Address',
			name: 'pollingAddress',
			type: 'string',
			default: '0xD3A9FE267852281a1e6307a1C37CDfD76d39b133',
			description: 'The polling contract address for governance polls',
		},
		{
			displayName: 'Delegate Factory Address',
			name: 'delegateFactoryAddress',
			type: 'string',
			default: '0xD897F108670903D1d6070fcf818f9db3615AF272',
			description: 'The delegate factory contract for MKR delegation',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {},
	};
}
