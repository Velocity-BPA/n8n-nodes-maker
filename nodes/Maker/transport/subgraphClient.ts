/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Subgraph Client
 * 
 * Client for querying Maker Protocol data from The Graph subgraphs.
 * Provides indexed access to historical and aggregated protocol data.
 */

import { GraphQLClient, gql } from 'graphql-request';

// Subgraph endpoints
export const SUBGRAPH_URLS = {
	maker: 'https://api.thegraph.com/subgraphs/name/makerdao/makerdao',
	governance: 'https://api.thegraph.com/subgraphs/name/protofire/makerdao-governance',
	vaults: 'https://api.thegraph.com/subgraphs/name/makerdao/makerdao-vaults',
	daiStats: 'https://api.thegraph.com/subgraphs/name/makerdao/dai-stats',
};

export interface SubgraphConfig {
	url: string;
	apiKey?: string;
}

export class SubgraphClient {
	private client: GraphQLClient;

	constructor(config: SubgraphConfig) {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};
		
		if (config.apiKey) {
			headers['Authorization'] = `Bearer ${config.apiKey}`;
		}
		
		this.client = new GraphQLClient(config.url, { headers });
	}

	/**
	 * Execute a GraphQL query
	 */
	async query<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
		return this.client.request<T>(query, variables);
	}

	// ===================
	// Vault Queries
	// ===================

	/**
	 * Get vaults by owner
	 */
	async getVaultsByOwner(owner: string, first: number = 100): Promise<{
		vaults: Array<{
			id: string;
			cdpId: string;
			collateralType: string;
			collateral: string;
			debt: string;
			owner: string;
			openedAt: string;
			updatedAt: string;
		}>;
	}> {
		const query = gql`
			query GetVaults($owner: String!, $first: Int!) {
				vaults(where: { owner: $owner }, first: $first, orderBy: openedAt, orderDirection: desc) {
					id
					cdpId
					collateralType
					collateral
					debt
					owner
					openedAt
					updatedAt
				}
			}
		`;
		return this.query(query, { owner: owner.toLowerCase(), first });
	}

	/**
	 * Get vault by ID
	 */
	async getVaultById(cdpId: string): Promise<{
		vault: {
			id: string;
			cdpId: string;
			collateralType: string;
			collateral: string;
			debt: string;
			owner: string;
			openedAt: string;
			updatedAt: string;
			collateralDeposited: string;
			collateralWithdrawn: string;
			debtGenerated: string;
			debtRepaid: string;
		} | null;
	}> {
		const query = gql`
			query GetVault($cdpId: String!) {
				vault(id: $cdpId) {
					id
					cdpId
					collateralType
					collateral
					debt
					owner
					openedAt
					updatedAt
					collateralDeposited
					collateralWithdrawn
					debtGenerated
					debtRepaid
				}
			}
		`;
		return this.query(query, { cdpId });
	}

	/**
	 * Get vault events
	 */
	async getVaultEvents(cdpId: string, first: number = 50): Promise<{
		vaultEvents: Array<{
			id: string;
			vault: { cdpId: string };
			type: string;
			collateralAmount: string;
			debtAmount: string;
			timestamp: string;
			transactionHash: string;
		}>;
	}> {
		const query = gql`
			query GetVaultEvents($cdpId: String!, $first: Int!) {
				vaultEvents(
					where: { vault_: { cdpId: $cdpId } }
					first: $first
					orderBy: timestamp
					orderDirection: desc
				) {
					id
					vault {
						cdpId
					}
					type
					collateralAmount
					debtAmount
					timestamp
					transactionHash
				}
			}
		`;
		return this.query(query, { cdpId, first });
	}

	// ===================
	// Collateral Queries
	// ===================

	/**
	 * Get all collateral types
	 */
	async getCollateralTypes(): Promise<{
		collateralTypes: Array<{
			id: string;
			rate: string;
			spot: string;
			line: string;
			dust: string;
			totalDebt: string;
			totalCollateral: string;
			liquidationRatio: string;
			stabilityFee: string;
			vaultsCount: string;
		}>;
	}> {
		const query = gql`
			query GetCollateralTypes {
				collateralTypes(first: 100, orderBy: totalDebt, orderDirection: desc) {
					id
					rate
					spot
					line
					dust
					totalDebt
					totalCollateral
					liquidationRatio
					stabilityFee
					vaultsCount
				}
			}
		`;
		return this.query(query);
	}

	/**
	 * Get collateral type info
	 */
	async getCollateralType(ilk: string): Promise<{
		collateralType: {
			id: string;
			rate: string;
			spot: string;
			line: string;
			dust: string;
			totalDebt: string;
			totalCollateral: string;
			liquidationRatio: string;
			stabilityFee: string;
			vaultsCount: string;
			unmanagedVaultsCount: string;
		} | null;
	}> {
		const query = gql`
			query GetCollateralType($ilk: ID!) {
				collateralType(id: $ilk) {
					id
					rate
					spot
					line
					dust
					totalDebt
					totalCollateral
					liquidationRatio
					stabilityFee
					vaultsCount
					unmanagedVaultsCount
				}
			}
		`;
		return this.query(query, { ilk });
	}

	// ===================
	// Liquidation Queries
	// ===================

	/**
	 * Get liquidations
	 */
	async getLiquidations(first: number = 50): Promise<{
		liquidations: Array<{
			id: string;
			vault: { cdpId: string; collateralType: string };
			collateralAmount: string;
			debtAmount: string;
			penalty: string;
			timestamp: string;
			transactionHash: string;
		}>;
	}> {
		const query = gql`
			query GetLiquidations($first: Int!) {
				liquidations(first: $first, orderBy: timestamp, orderDirection: desc) {
					id
					vault {
						cdpId
						collateralType
					}
					collateralAmount
					debtAmount
					penalty
					timestamp
					transactionHash
				}
			}
		`;
		return this.query(query, { first });
	}

	/**
	 * Get auctions
	 */
	async getAuctions(status: string = 'active', first: number = 50): Promise<{
		auctions: Array<{
			id: string;
			vault: { cdpId: string };
			collateralType: string;
			collateralAmount: string;
			debtAmount: string;
			startPrice: string;
			currentPrice: string;
			status: string;
			timestamp: string;
		}>;
	}> {
		const query = gql`
			query GetAuctions($status: String!, $first: Int!) {
				auctions(
					where: { status: $status }
					first: $first
					orderBy: timestamp
					orderDirection: desc
				) {
					id
					vault {
						cdpId
					}
					collateralType
					collateralAmount
					debtAmount
					startPrice
					currentPrice
					status
					timestamp
				}
			}
		`;
		return this.query(query, { status, first });
	}

	// ===================
	// System Stats Queries
	// ===================

	/**
	 * Get system state
	 */
	async getSystemState(): Promise<{
		systemState: {
			id: string;
			totalDebt: string;
			totalCollateral: string;
			debtCeiling: string;
			baseRate: string;
			savingsRate: string;
			savingsBalance: string;
			block: string;
			timestamp: string;
		} | null;
	}> {
		const query = gql`
			query GetSystemState {
				systemState(id: "current") {
					id
					totalDebt
					totalCollateral
					debtCeiling
					baseRate
					savingsRate
					savingsBalance
					block
					timestamp
				}
			}
		`;
		return this.query(query);
	}

	/**
	 * Get daily stats
	 */
	async getDailyStats(first: number = 30): Promise<{
		dailyStats: Array<{
			id: string;
			date: string;
			totalDebt: string;
			totalCollateral: string;
			daiSupply: string;
			savingsBalance: string;
			savingsRate: string;
		}>;
	}> {
		const query = gql`
			query GetDailyStats($first: Int!) {
				dailyStats(first: $first, orderBy: date, orderDirection: desc) {
					id
					date
					totalDebt
					totalCollateral
					daiSupply
					savingsBalance
					savingsRate
				}
			}
		`;
		return this.query(query, { first });
	}

	// ===================
	// DSR Queries
	// ===================

	/**
	 * Get DSR deposits
	 */
	async getDsrDeposits(owner: string, first: number = 50): Promise<{
		dsrDeposits: Array<{
			id: string;
			owner: string;
			amount: string;
			timestamp: string;
			transactionHash: string;
		}>;
	}> {
		const query = gql`
			query GetDsrDeposits($owner: String!, $first: Int!) {
				dsrDeposits(
					where: { owner: $owner }
					first: $first
					orderBy: timestamp
					orderDirection: desc
				) {
					id
					owner
					amount
					timestamp
					transactionHash
				}
			}
		`;
		return this.query(query, { owner: owner.toLowerCase(), first });
	}

	/**
	 * Get DSR withdrawals
	 */
	async getDsrWithdrawals(owner: string, first: number = 50): Promise<{
		dsrWithdrawals: Array<{
			id: string;
			owner: string;
			amount: string;
			timestamp: string;
			transactionHash: string;
		}>;
	}> {
		const query = gql`
			query GetDsrWithdrawals($owner: String!, $first: Int!) {
				dsrWithdrawals(
					where: { owner: $owner }
					first: $first
					orderBy: timestamp
					orderDirection: desc
				) {
					id
					owner
					amount
					timestamp
					transactionHash
				}
			}
		`;
		return this.query(query, { owner: owner.toLowerCase(), first });
	}

	// ===================
	// Transfer Queries
	// ===================

	/**
	 * Get DAI transfers
	 */
	async getDaiTransfers(address: string, first: number = 50): Promise<{
		transfers: Array<{
			id: string;
			from: string;
			to: string;
			value: string;
			timestamp: string;
			transactionHash: string;
		}>;
	}> {
		const query = gql`
			query GetDaiTransfers($address: String!, $first: Int!) {
				transfers(
					where: { or: [{ from: $address }, { to: $address }] }
					first: $first
					orderBy: timestamp
					orderDirection: desc
				) {
					id
					from
					to
					value
					timestamp
					transactionHash
				}
			}
		`;
		return this.query(query, { address: address.toLowerCase(), first });
	}
}

/**
 * Create subgraph client from n8n credentials
 */
export function createSubgraphClient(credentials: {
	subgraphType: string;
	subgraphUrl?: string;
	apiKey?: string;
}): SubgraphClient {
	let url: string;
	
	if (credentials.subgraphType === 'custom' && credentials.subgraphUrl) {
		url = credentials.subgraphUrl;
	} else {
		url = SUBGRAPH_URLS[credentials.subgraphType as keyof typeof SUBGRAPH_URLS] || SUBGRAPH_URLS.maker;
	}
	
	return new SubgraphClient({
		url,
		apiKey: credentials.apiKey,
	});
}

/**
 * Get subgraph client for specific subgraph type
 */
export function getSubgraphClient(type: keyof typeof SUBGRAPH_URLS, apiKey?: string): SubgraphClient {
	return new SubgraphClient({
		url: SUBGRAPH_URLS[type],
		apiKey,
	});
}
