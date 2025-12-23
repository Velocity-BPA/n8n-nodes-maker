/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Ilk (Collateral Type) Utilities
 * 
 * Helper functions for working with ilks in the Maker Protocol.
 */

import { getIlkBytes32, getIlkInfo, ILK_INFO, ILKS } from '../constants/ilks';
import { fromRay, fromRad, fromWad, RAY, RAD, WAD } from './mathUtils';

export interface IlkData {
	ilk: string;
	Art: bigint;           // Total normalized debt (WAD)
	rate: bigint;          // Accumulated rate (RAY)
	spot: bigint;          // Price with safety margin (RAY)
	line: bigint;          // Debt ceiling (RAD)
	dust: bigint;          // Minimum debt (RAD)
}

export interface IlkParameters {
	liquidationRatio: number;      // mat (e.g., 1.5 for 150%)
	stabilityFee: number;          // duty (annual %)
	debtCeiling: number;           // line (DAI)
	debtFloor: number;             // dust (DAI)
	liquidationPenalty: number;    // chop (e.g., 0.13 for 13%)
	auctionSize: number;           // hole (DAI)
}

export interface FormattedIlkInfo {
	name: string;
	symbol: string;
	totalDebt: string;
	debtCeiling: string;
	utilizationRate: string;
	stabilityFee: string;
	liquidationRatio: string;
	currentPrice: string;
	dustLimit: string;
}

/**
 * Parse ilk name from bytes32
 */
export function parseIlkName(ilkBytes32: string): string {
	// Remove 0x prefix if present
	const hex = ilkBytes32.startsWith('0x') ? ilkBytes32.slice(2) : ilkBytes32;
	
	// Convert hex to string, removing null bytes
	let result = '';
	for (let i = 0; i < hex.length; i += 2) {
		const byte = parseInt(hex.substr(i, 2), 16);
		if (byte === 0) break;
		result += String.fromCharCode(byte);
	}
	
	return result;
}

/**
 * Calculate total debt for an ilk
 * totalDebt = Art * rate
 */
export function calculateIlkTotalDebt(Art: bigint, rate: bigint): bigint {
	return (Art * rate) / RAY;
}

/**
 * Calculate utilization rate
 * utilization = totalDebt / debtCeiling
 */
export function calculateUtilizationRate(totalDebt: bigint, line: bigint): number {
	if (line === 0n) return 0;
	const debtCeiling = line / RAD * WAD; // Convert RAD to WAD
	return fromWad(totalDebt) / fromWad(debtCeiling) * 100;
}

/**
 * Calculate available debt headroom
 */
export function calculateAvailableDebt(Art: bigint, rate: bigint, line: bigint): bigint {
	const currentDebt = calculateIlkTotalDebt(Art, rate);
	const ceiling = line / RAY; // RAD to WAD
	return ceiling > currentDebt ? ceiling - currentDebt : 0n;
}

/**
 * Format ilk data for display
 */
export function formatIlkData(ilkData: IlkData): FormattedIlkInfo {
	const ilkInfo = getIlkInfo(ilkData.ilk);
	const totalDebt = calculateIlkTotalDebt(ilkData.Art, ilkData.rate);
	const debtCeiling = ilkData.line / RAY; // RAD to WAD
	const utilization = calculateUtilizationRate(totalDebt, ilkData.line);
	
	// Calculate stability fee from rate (simplified - actual calculation needs jug.duty)
	// This is just the spot price for now
	const spotPrice = fromRay(ilkData.spot);
	
	return {
		name: ilkData.ilk,
		symbol: ilkInfo?.symbol || ilkData.ilk.split('-')[0],
		totalDebt: `${fromWad(totalDebt).toFixed(2)} DAI`,
		debtCeiling: `${fromWad(debtCeiling).toFixed(0)} DAI`,
		utilizationRate: `${utilization.toFixed(2)}%`,
		stabilityFee: 'See jug.duty', // Would need to fetch from jug contract
		liquidationRatio: 'See spot.mat', // Would need to fetch from spot contract
		currentPrice: `$${spotPrice.toFixed(2)}`,
		dustLimit: `${fromRad(ilkData.dust).toFixed(0)} DAI`,
	};
}

/**
 * Get list of all ilk names
 */
export function getAllIlkNames(): string[] {
	return Object.keys(ILKS);
}

/**
 * Get ilks by category
 */
export function getIlksByCategory(category: 'crypto' | 'rwa' | 'stablecoin' | 'lp'): string[] {
	return Object.entries(ILK_INFO)
		.filter(([_, info]) => info.category === category)
		.map(([name]) => name);
}

/**
 * Check if an ilk is a PSM
 */
export function isPsmIlk(ilkName: string): boolean {
	return ilkName.startsWith('PSM-');
}

/**
 * Check if an ilk is a Real World Asset
 */
export function isRwaIlk(ilkName: string): boolean {
	return ilkName.startsWith('RWA');
}

/**
 * Check if an ilk is a Direct Deposit Module
 */
export function isD3mIlk(ilkName: string): boolean {
	return ilkName.startsWith('DIRECT-');
}

/**
 * Get token address for ilk
 */
export function getIlkTokenAddress(ilkName: string): string | undefined {
	const info = getIlkInfo(ilkName);
	return info?.tokenAddress;
}

/**
 * Get join adapter address for ilk
 */
export function getIlkJoinAddress(ilkName: string): string | undefined {
	const info = getIlkInfo(ilkName);
	return info?.joinAddress;
}

/**
 * JUG (Stability Fee) Contract ABI
 */
export const JUG_ABI = [
	'function vat() view returns (address)',
	'function vow() view returns (address)',
	'function ilks(bytes32) view returns (uint256 duty, uint256 rho)',
	'function base() view returns (uint256)',
	'function drip(bytes32) returns (uint256)',
	
	'event Drip(bytes32 indexed ilk)',
];

/**
 * SPOT_CONTRACT_ABI (Oracle) Contract ABI
 */
export const SPOT_CONTRACT_ABI = [
	'function vat() view returns (address)',
	'function par() view returns (uint256)',
	'function ilks(bytes32) view returns (address pip, uint256 mat)',
	'function poke(bytes32)',
	
	'event Poke(bytes32 ilk, bytes32 val, uint256 spot)',
];

/**
 * GEM JOIN Contract ABI (generic collateral adapter)
 */
export const GEM_JOIN_ABI = [
	'function vat() view returns (address)',
	'function ilk() view returns (bytes32)',
	'function gem() view returns (address)',
	'function dec() view returns (uint256)',
	'function live() view returns (uint256)',
	
	'function join(address, uint256)',
	'function exit(address, uint256)',
];

/**
 * DAI JOIN Contract ABI
 */
export const DAI_JOIN_ABI = [
	'function vat() view returns (address)',
	'function dai() view returns (address)',
	'function live() view returns (uint256)',
	
	'function join(address, uint256)',
	'function exit(address, uint256)',
];
