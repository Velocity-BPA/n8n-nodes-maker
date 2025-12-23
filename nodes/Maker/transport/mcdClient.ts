/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * MCD (Multi-Collateral DAI) Client
 * 
 * Main client for interacting with Maker Protocol contracts.
 * Handles provider setup, contract instantiation, and common operations.
 */

import { ethers, Contract, Provider, Wallet, JsonRpcProvider } from 'ethers';
import { MAINNET_CONTRACTS, NETWORK_CONFIG, DEFAULT_RPC_URLS, NetworkContracts } from '../constants/contracts';
import { getIlkBytes32 } from '../constants/ilks';
import { VAT_ABI, CDP_MANAGER_ABI, GET_CDPS_ABI } from '../utils/vaultUtils';
import { POT_ABI, SDAI_ABI } from '../utils/dsrUtils';
import { JUG_ABI, GEM_JOIN_ABI, DAI_JOIN_ABI } from '../utils/ilkUtils';

// ERC20 ABI for token interactions
export const ERC20_ABI = [
	'function name() view returns (string)',
	'function symbol() view returns (string)',
	'function decimals() view returns (uint8)',
	'function totalSupply() view returns (uint256)',
	'function balanceOf(address) view returns (uint256)',
	'function allowance(address, address) view returns (uint256)',
	'function approve(address, uint256) returns (bool)',
	'function transfer(address, uint256) returns (bool)',
	'function transferFrom(address, address, uint256) returns (bool)',
	'event Transfer(address indexed from, address indexed to, uint256 value)',
	'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

// DAI specific ABI (includes permit)
export const DAI_ABI = [
	...ERC20_ABI,
	'function permit(address holder, address spender, uint256 nonce, uint256 expiry, bool allowed, uint8 v, bytes32 r, bytes32 s)',
	'function nonces(address) view returns (uint256)',
	'function DOMAIN_SEPARATOR() view returns (bytes32)',
	'function PERMIT_TYPEHASH() view returns (bytes32)',
];

export interface McdClientConfig {
	network: string;
	rpcUrl?: string;
	privateKey?: string;
	chainId?: number;
}

export interface TokenBalance {
	address: string;
	balance: bigint;
	decimals: number;
	symbol: string;
	formatted: string;
}

export class McdClient {
	private provider: Provider;
	private signer: Wallet | null = null;
	private contracts: Partial<NetworkContracts>;
	private network: string;

	constructor(config: McdClientConfig) {
		this.network = config.network;
		
		// Set up provider
		const rpcUrl = config.rpcUrl || DEFAULT_RPC_URLS[config.network] || DEFAULT_RPC_URLS.mainnet;
		this.provider = new JsonRpcProvider(rpcUrl);
		
		// Set up signer if private key provided
		if (config.privateKey) {
			this.signer = new Wallet(config.privateKey, this.provider);
		}
		
		// Get contract addresses for network
		const networkConfig = NETWORK_CONFIG[config.network as keyof typeof NETWORK_CONFIG];
		this.contracts = networkConfig?.contracts || MAINNET_CONTRACTS;
	}

	/**
	 * Get the provider
	 */
	getProvider(): Provider {
		return this.provider;
	}

	/**
	 * Get the signer (if available)
	 */
	getSigner(): Wallet | null {
		return this.signer;
	}

	/**
	 * Get contract addresses
	 */
	getContracts(): Partial<NetworkContracts> {
		return this.contracts;
	}

	/**
	 * Get the signer address
	 */
	async getAddress(): Promise<string> {
		if (!this.signer) {
			throw new Error('No signer available - private key required');
		}
		return this.signer.address;
	}

	// ===================
	// Token Operations
	// ===================

	/**
	 * Get DAI contract
	 */
	getDaiContract(): Contract {
		return new Contract(
			this.contracts.dai || MAINNET_CONTRACTS.dai,
			DAI_ABI,
			this.signer || this.provider
		);
	}

	/**
	 * Get MKR contract
	 */
	getMkrContract(): Contract {
		return new Contract(
			this.contracts.mkr || MAINNET_CONTRACTS.mkr,
			ERC20_ABI,
			this.signer || this.provider
		);
	}

	/**
	 * Get USDS contract
	 */
	getUsdsContract(): Contract {
		return new Contract(
			this.contracts.usds || MAINNET_CONTRACTS.usds,
			ERC20_ABI,
			this.signer || this.provider
		);
	}

	/**
	 * Get SKY contract
	 */
	getSkyContract(): Contract {
		return new Contract(
			this.contracts.sky || MAINNET_CONTRACTS.sky,
			ERC20_ABI,
			this.signer || this.provider
		);
	}

	/**
	 * Get sDAI contract
	 */
	getSdaiContract(): Contract {
		return new Contract(
			this.contracts.sdai || MAINNET_CONTRACTS.sdai,
			SDAI_ABI,
			this.signer || this.provider
		);
	}

	/**
	 * Get token balance
	 */
	async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<TokenBalance> {
		const token = new Contract(tokenAddress, ERC20_ABI, this.provider);
		const [balance, decimals, symbol] = await Promise.all([
			token.balanceOf(walletAddress),
			token.decimals(),
			token.symbol(),
		]);
		
		return {
			address: tokenAddress,
			balance,
			decimals,
			symbol,
			formatted: ethers.formatUnits(balance, decimals),
		};
	}

	/**
	 * Get DAI balance
	 */
	async getDaiBalance(address: string): Promise<TokenBalance> {
		return this.getTokenBalance(this.contracts.dai || MAINNET_CONTRACTS.dai, address);
	}

	/**
	 * Get MKR balance
	 */
	async getMkrBalance(address: string): Promise<TokenBalance> {
		return this.getTokenBalance(this.contracts.mkr || MAINNET_CONTRACTS.mkr, address);
	}

	/**
	 * Transfer tokens
	 */
	async transferToken(
		tokenAddress: string,
		to: string,
		amount: bigint
	): Promise<ethers.TransactionResponse> {
		if (!this.signer) {
			throw new Error('Signer required for transfers');
		}
		const token = new Contract(tokenAddress, ERC20_ABI, this.signer);
		return token.transfer(to, amount);
	}

	/**
	 * Approve token spending
	 */
	async approveToken(
		tokenAddress: string,
		spender: string,
		amount: bigint
	): Promise<ethers.TransactionResponse> {
		if (!this.signer) {
			throw new Error('Signer required for approvals');
		}
		const token = new Contract(tokenAddress, ERC20_ABI, this.signer);
		return token.approve(spender, amount);
	}

	// ===================
	// Core MCD Operations
	// ===================

	/**
	 * Get VAT contract (core vault engine)
	 */
	getVatContract(): Contract {
		return new Contract(
			this.contracts.vat || MAINNET_CONTRACTS.vat,
			VAT_ABI,
			this.signer || this.provider
		);
	}

	/**
	 * Get CDP Manager contract
	 */
	getCdpManagerContract(): Contract {
		return new Contract(
			this.contracts.cdpManager || MAINNET_CONTRACTS.cdpManager,
			CDP_MANAGER_ABI,
			this.signer || this.provider
		);
	}

	/**
	 * Get GetCdps helper contract
	 */
	getGetCdpsContract(): Contract {
		return new Contract(
			this.contracts.getCdps || MAINNET_CONTRACTS.getCdps,
			GET_CDPS_ABI,
			this.provider
		);
	}

	/**
	 * Get ilk info from VAT
	 */
	async getIlkInfo(ilkName: string): Promise<{
		Art: bigint;
		rate: bigint;
		spot: bigint;
		line: bigint;
		dust: bigint;
	}> {
		const vat = this.getVatContract();
		const ilkBytes32 = getIlkBytes32(ilkName);
		const ilkInfo = await vat.ilks(ilkBytes32);
		return {
			Art: ilkInfo[0],
			rate: ilkInfo[1],
			spot: ilkInfo[2],
			line: ilkInfo[3],
			dust: ilkInfo[4],
		};
	}

	/**
	 * Get vault (urn) info
	 */
	async getUrnInfo(ilkName: string, urnAddress: string): Promise<{
		ink: bigint;  // Collateral
		art: bigint;  // Normalized debt
	}> {
		const vat = this.getVatContract();
		const ilkBytes32 = getIlkBytes32(ilkName);
		const urnInfo = await vat.urns(ilkBytes32, urnAddress);
		return {
			ink: urnInfo[0],
			art: urnInfo[1],
		};
	}

	/**
	 * Get user's vaults via CDP Manager
	 */
	async getUserVaults(owner: string): Promise<{
		ids: bigint[];
		urns: string[];
		ilks: string[];
	}> {
		const getCdps = this.getGetCdpsContract();
		const cdpManager = this.contracts.cdpManager || MAINNET_CONTRACTS.cdpManager;
		const result = await getCdps.getCdpsDesc(cdpManager, owner);
		return {
			ids: result[0],
			urns: result[1],
			ilks: result[2],
		};
	}

	// ===================
	// DSR Operations
	// ===================

	/**
	 * Get POT contract (DSR)
	 */
	getPotContract(): Contract {
		return new Contract(
			this.contracts.pot || MAINNET_CONTRACTS.pot,
			POT_ABI,
			this.signer || this.provider
		);
	}

	/**
	 * Get DSR info
	 */
	async getDsrInfo(): Promise<{
		dsr: bigint;
		chi: bigint;
		rho: bigint;
		Pie: bigint;
	}> {
		const pot = this.getPotContract();
		const [dsr, chi, rho, Pie] = await Promise.all([
			pot.dsr(),
			pot.chi(),
			pot.rho(),
			pot.Pie(),
		]);
		return { dsr, chi, rho, Pie };
	}

	/**
	 * Get user's DSR balance (pie)
	 */
	async getDsrBalance(address: string): Promise<bigint> {
		const pot = this.getPotContract();
		return pot.pie(address);
	}

	// ===================
	// sDAI Operations
	// ===================

	/**
	 * Get sDAI balance
	 */
	async getSdaiBalance(address: string): Promise<TokenBalance> {
		return this.getTokenBalance(this.contracts.sdai || MAINNET_CONTRACTS.sdai, address);
	}

	/**
	 * Get sDAI exchange rate (assets per share)
	 */
	async getSdaiExchangeRate(): Promise<{
		totalAssets: bigint;
		totalSupply: bigint;
		rate: number;
	}> {
		const sdai = this.getSdaiContract();
		const [totalAssets, totalSupply] = await Promise.all([
			sdai.totalAssets(),
			sdai.totalSupply(),
		]);
		const rate = totalSupply > 0n 
			? Number(totalAssets) / Number(totalSupply)
			: 1;
		return { totalAssets, totalSupply, rate };
	}

	/**
	 * Preview sDAI deposit (DAI -> sDAI)
	 */
	async previewSdaiDeposit(daiAmount: bigint): Promise<bigint> {
		const sdai = this.getSdaiContract();
		return sdai.previewDeposit(daiAmount);
	}

	/**
	 * Preview sDAI withdraw (sDAI -> DAI)
	 */
	async previewSdaiWithdraw(daiAmount: bigint): Promise<bigint> {
		const sdai = this.getSdaiContract();
		return sdai.previewWithdraw(daiAmount);
	}

	// ===================
	// System Info
	// ===================

	/**
	 * Get global debt ceiling
	 */
	async getGlobalDebtCeiling(): Promise<bigint> {
		const vat = this.getVatContract();
		return vat.Line();
	}

	/**
	 * Get total system debt
	 */
	async getTotalDebt(): Promise<bigint> {
		const vat = this.getVatContract();
		return vat.debt();
	}

	/**
	 * Get system surplus/deficit
	 */
	async getSystemSurplus(): Promise<bigint> {
		const vat = this.getVatContract();
		const vowAddress = this.contracts.vow || MAINNET_CONTRACTS.vow;
		return vat.dai(vowAddress);
	}

	// ===================
	// JUG Operations
	// ===================

	/**
	 * Get JUG contract (stability fees)
	 */
	getJugContract(): Contract {
		return new Contract(
			this.contracts.jug || MAINNET_CONTRACTS.jug,
			JUG_ABI,
			this.signer || this.provider
		);
	}

	/**
	 * Get stability fee for ilk
	 */
	async getStabilityFee(ilkName: string): Promise<{
		duty: bigint;
		rho: bigint;
	}> {
		const jug = this.getJugContract();
		const ilkBytes32 = getIlkBytes32(ilkName);
		const ilkInfo = await jug.ilks(ilkBytes32);
		return {
			duty: ilkInfo[0],
			rho: ilkInfo[1],
		};
	}

	/**
	 * Get base stability fee
	 */
	async getBaseStabilityFee(): Promise<bigint> {
		const jug = this.getJugContract();
		return jug.base();
	}

	// ===================
	// Utility Methods
	// ===================

	/**
	 * Get current block number
	 */
	async getBlockNumber(): Promise<number> {
		return this.provider.getBlockNumber();
	}

	/**
	 * Get current gas price
	 */
	async getGasPrice(): Promise<bigint> {
		const feeData = await this.provider.getFeeData();
		return feeData.gasPrice || 0n;
	}

	/**
	 * Estimate gas for a transaction
	 */
	async estimateGas(tx: ethers.TransactionRequest): Promise<bigint> {
		return this.provider.estimateGas(tx);
	}

	/**
	 * Wait for transaction confirmation
	 */
	async waitForTransaction(
		txHash: string,
		confirmations: number = 1
	): Promise<ethers.TransactionReceipt | null> {
		return this.provider.waitForTransaction(txHash, confirmations);
	}
}

/**
 * Create MCD client from n8n credentials
 */
export function createMcdClient(credentials: {
	network: string;
	privateKey?: string;
	rpcUrl?: string;
	customRpcUrl?: string;
	usePublicRpc?: boolean;
	chainId?: number;
}): McdClient {
	let rpcUrl = credentials.rpcUrl;
	
	// Handle custom RPC URL
	if (!credentials.usePublicRpc && credentials.customRpcUrl) {
		rpcUrl = credentials.customRpcUrl;
	} else if (credentials.network !== 'custom') {
		rpcUrl = DEFAULT_RPC_URLS[credentials.network];
	}
	
	return new McdClient({
		network: credentials.network,
		rpcUrl,
		privateKey: credentials.privateKey,
		chainId: credentials.chainId,
	});
}
