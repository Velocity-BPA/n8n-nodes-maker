/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Vault (CDP) Utilities
 * 
 * Vaults (formerly CDPs - Collateralized Debt Positions) are the core
 * of the Maker protocol. Users lock collateral to generate DAI.
 */

import { 
	fromWad, 
	fromRay, 
	toWad, 
	rmul, 
	rdiv,
	RAY,
	WAD,
	calculateCollateralizationRatio,
	calculateLiquidationPrice,
	calculateMaxDai,
	calculateMaxWithdraw,
} from './mathUtils';

export interface VaultData {
	id: number;
	owner: string;
	ilk: string;
	collateral: bigint;     // WAD - collateral locked
	debt: bigint;           // WAD - normalized debt (art)
	rate: bigint;           // RAY - accumulated rate
	spot: bigint;           // RAY - collateral price with safety margin
	line: bigint;           // RAD - debt ceiling
	dust: bigint;           // RAD - minimum debt
	mat: bigint;            // RAY - liquidation ratio
}

export interface VaultStatus {
	id: number;
	ilk: string;
	owner: string;
	collateralAmount: string;
	collateralValue: string;
	debtAmount: string;
	collateralizationRatio: number;
	liquidationPrice: string;
	liquidationRatio: number;
	maxAvailableToGenerate: string;
	maxAvailableToWithdraw: string;
	isAtRisk: boolean;
	riskLevel: 'safe' | 'moderate' | 'high' | 'critical';
}

/**
 * Calculate actual debt from normalized debt and rate
 * actualDebt = art * rate
 */
export function calculateActualDebt(normalizedDebt: bigint, rate: bigint): bigint {
	return rmul(normalizedDebt, rate) * WAD / RAY;
}

/**
 * Calculate normalized debt from actual debt and rate
 * normalizedDebt = actualDebt / rate
 */
export function calculateNormalizedDebt(actualDebt: bigint, rate: bigint): bigint {
	return rdiv(actualDebt * RAY / WAD, rate) * WAD / RAY;
}

/**
 * Check if vault is at risk of liquidation
 */
export function isVaultAtRisk(
	collateralWad: bigint,
	debtWad: bigint,
	priceRay: bigint,
	matRay: bigint,
	warningThreshold: number = 1.2 // 120% of liquidation ratio
): boolean {
	const currentRatio = calculateCollateralizationRatio(collateralWad, priceRay, debtWad);
	const liquidationRatio = fromRay(matRay);
	return currentRatio < liquidationRatio * warningThreshold;
}

/**
 * Get vault risk level
 */
export function getVaultRiskLevel(
	collateralWad: bigint,
	debtWad: bigint,
	priceRay: bigint,
	matRay: bigint
): 'safe' | 'moderate' | 'high' | 'critical' {
	const currentRatio = calculateCollateralizationRatio(collateralWad, priceRay, debtWad);
	const liquidationRatio = fromRay(matRay);
	
	const ratioToLiq = currentRatio / liquidationRatio;
	
	if (ratioToLiq <= 1) return 'critical';
	if (ratioToLiq <= 1.1) return 'high';
	if (ratioToLiq <= 1.3) return 'moderate';
	return 'safe';
}

/**
 * Format vault data into human-readable status
 */
export function formatVaultStatus(vault: VaultData, currentPrice: bigint): VaultStatus {
	const actualDebt = calculateActualDebt(vault.debt, vault.rate);
	const collateralValue = rmul(vault.collateral * RAY / WAD, currentPrice) * WAD / RAY;
	const collRatio = calculateCollateralizationRatio(vault.collateral, currentPrice, actualDebt);
	const liqPrice = calculateLiquidationPrice(vault.collateral, actualDebt, vault.mat);
	const maxGenerate = calculateMaxDai(vault.collateral, currentPrice, vault.mat, actualDebt);
	const maxWithdraw = calculateMaxWithdraw(vault.collateral, actualDebt, currentPrice, vault.mat);
	
	return {
		id: vault.id,
		ilk: vault.ilk,
		owner: vault.owner,
		collateralAmount: fromWad(vault.collateral).toFixed(6),
		collateralValue: fromWad(collateralValue).toFixed(2),
		debtAmount: fromWad(actualDebt).toFixed(2),
		collateralizationRatio: collRatio,
		liquidationPrice: fromRay(liqPrice).toFixed(2),
		liquidationRatio: fromRay(vault.mat) * 100,
		maxAvailableToGenerate: fromWad(maxGenerate).toFixed(2),
		maxAvailableToWithdraw: fromWad(maxWithdraw).toFixed(6),
		isAtRisk: isVaultAtRisk(vault.collateral, actualDebt, currentPrice, vault.mat),
		riskLevel: getVaultRiskLevel(vault.collateral, actualDebt, currentPrice, vault.mat),
	};
}

/**
 * Validate vault operation parameters
 */
export function validateVaultOperation(
	operation: 'deposit' | 'withdraw' | 'generate' | 'repay',
	amount: bigint,
	vault: VaultData,
	currentPrice: bigint
): { valid: boolean; error?: string } {
	const actualDebt = calculateActualDebt(vault.debt, vault.rate);
	
	switch (operation) {
		case 'deposit':
			if (amount <= 0n) {
				return { valid: false, error: 'Deposit amount must be greater than 0' };
			}
			return { valid: true };
			
		case 'withdraw': {
			const maxWithdraw = calculateMaxWithdraw(vault.collateral, actualDebt, currentPrice, vault.mat);
			if (amount > maxWithdraw) {
				return { 
					valid: false, 
					error: `Cannot withdraw ${fromWad(amount)}. Maximum available: ${fromWad(maxWithdraw)}`
				};
			}
			return { valid: true };
		}
		
		case 'generate': {
			const maxGenerate = calculateMaxDai(vault.collateral, currentPrice, vault.mat, actualDebt);
			if (amount > maxGenerate) {
				return {
					valid: false,
					error: `Cannot generate ${fromWad(amount)} DAI. Maximum available: ${fromWad(maxGenerate)}`
				};
			}
			// Check dust limit
			const newDebt = actualDebt + amount;
			const dustWad = vault.dust * WAD / (RAY * WAD); // Convert RAD to WAD
			if (newDebt > 0n && newDebt < dustWad) {
				return {
					valid: false,
					error: `Resulting debt ${fromWad(newDebt)} is below dust limit ${fromWad(dustWad)}`
				};
			}
			return { valid: true };
		}
		
		case 'repay': {
			if (amount > actualDebt) {
				return {
					valid: false,
					error: `Cannot repay ${fromWad(amount)} DAI. Current debt: ${fromWad(actualDebt)}`
				};
			}
			// Check dust limit after repay
			const remainingDebt = actualDebt - amount;
			const dustWad = vault.dust * WAD / (RAY * WAD);
			if (remainingDebt > 0n && remainingDebt < dustWad) {
				return {
					valid: false,
					error: `Remaining debt ${fromWad(remainingDebt)} would be below dust limit ${fromWad(dustWad)}. Repay all or leave more.`
				};
			}
			return { valid: true };
		}
		
		default:
			return { valid: false, error: 'Unknown operation' };
	}
}

/**
 * Calculate optimal collateral ratio for a given risk tolerance
 */
export function calculateOptimalRatio(
	liquidationRatio: number,
	riskTolerance: 'conservative' | 'moderate' | 'aggressive'
): number {
	const multipliers = {
		conservative: 2.5,  // 250% of liquidation ratio
		moderate: 1.75,     // 175% of liquidation ratio
		aggressive: 1.3,    // 130% of liquidation ratio
	};
	return liquidationRatio * multipliers[riskTolerance];
}

/**
 * CDP Manager ABI (partial)
 */
export const CDP_MANAGER_ABI = [
	'function vat() view returns (address)',
	'function cdpCan(address, uint256, address) view returns (uint256)',
	'function ilks(uint256) view returns (bytes32)',
	'function first(address) view returns (uint256)',
	'function last(address) view returns (uint256)',
	'function count(address) view returns (uint256)',
	'function owns(uint256) view returns (address)',
	'function urns(uint256) view returns (address)',
	
	'function open(bytes32, address) returns (uint256)',
	'function give(uint256, address)',
	'function frob(uint256, int256, int256)',
	'function flux(uint256, address, uint256)',
	'function move(uint256, address, uint256)',
	'function quit(uint256, address)',
	
	'event NewCdp(address indexed usr, address indexed own, uint256 indexed cdp)',
];

/**
 * VAT ABI (partial) - Core vault engine
 */
export const VAT_ABI = [
	// Read functions
	'function ilks(bytes32) view returns (uint256 Art, uint256 rate, uint256 spot, uint256 line, uint256 dust)',
	'function urns(bytes32, address) view returns (uint256 ink, uint256 art)',
	'function gem(bytes32, address) view returns (uint256)',
	'function dai(address) view returns (uint256)',
	'function sin(address) view returns (uint256)',
	'function debt() view returns (uint256)',
	'function vice() view returns (uint256)',
	'function Line() view returns (uint256)',
	'function live() view returns (uint256)',
	
	// Authorization
	'function can(address, address) view returns (uint256)',
	'function hope(address)',
	'function nope(address)',
	
	// Events
	'event Frob(bytes32 indexed i, address indexed u, address v, address w, int256 dink, int256 dart)',
];

/**
 * GetCdps helper contract ABI
 */
export const GET_CDPS_ABI = [
	'function getCdpsAsc(address manager, address guy) view returns (uint256[] ids, address[] urns, bytes32[] ilks)',
	'function getCdpsDesc(address manager, address guy) view returns (uint256[] ids, address[] urns, bytes32[] ilks)',
];
