/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * DSR (DAI Savings Rate) Utilities
 * 
 * The DSR allows DAI holders to earn interest by depositing DAI
 * into the DSR contract. Interest accrues based on the current rate.
 * 
 * Key concepts:
 * - chi: Accumulated DSR rate (RAY) - represents total growth since inception
 * - rho: Last update timestamp
 * - dsr: Per-second interest rate (RAY)
 * - pie: Normalized DAI balance (user's share of the pot)
 */

import { fromRay, fromWad, toWad, rmul, rpow, RAY, WAD, perSecondToAnnualRate } from './mathUtils';

export interface DsrInfo {
	dsr: bigint;           // Per-second rate (RAY)
	chi: bigint;           // Accumulated rate (RAY)
	rho: bigint;           // Last drip timestamp
	pie: bigint;           // Total normalized DAI (WAD)
}

export interface UserDsrPosition {
	pie: bigint;           // User's normalized balance
	dai: bigint;           // User's actual DAI value
	earnings: bigint;      // Accrued earnings
	apy: number;           // Current APY
}

/**
 * Calculate current chi value based on time elapsed
 * chi_new = chi_old * dsr^(now - rho)
 */
export function calculateCurrentChi(
	chi: bigint,
	dsr: bigint,
	rho: bigint,
	now: bigint = BigInt(Math.floor(Date.now() / 1000))
): bigint {
	const timeElapsed = now - rho;
	if (timeElapsed <= 0n) return chi;
	
	const rateMultiplier = rpow(dsr, timeElapsed);
	return rmul(chi, rateMultiplier);
}

/**
 * Calculate actual DAI balance from pie (normalized balance)
 * dai = pie * chi
 */
export function pieToDai(pie: bigint, chi: bigint): bigint {
	return rmul(pie * RAY / WAD, chi) * WAD / RAY;
}

/**
 * Calculate pie from DAI amount
 * pie = dai / chi
 */
export function daiToPie(dai: bigint, chi: bigint): bigint {
	// Round down for pie
	return (dai * RAY) / chi;
}

/**
 * Calculate DSR APY from per-second rate
 */
export function calculateDsrApy(dsr: bigint): number {
	return perSecondToAnnualRate(dsr);
}

/**
 * Calculate earnings for a given position
 */
export function calculateDsrEarnings(
	originalDeposit: bigint,
	currentPie: bigint,
	chi: bigint
): bigint {
	const currentValue = pieToDai(currentPie, chi);
	return currentValue - originalDeposit;
}

/**
 * Project future DSR earnings
 */
export function projectDsrEarnings(
	deposit: bigint,
	dsr: bigint,
	daysForward: number
): { futureValue: bigint; earnings: bigint; apy: number } {
	const secondsPerDay = 24 * 60 * 60;
	const totalSeconds = BigInt(daysForward * secondsPerDay);
	
	// Calculate rate multiplier
	const rateMultiplier = rpow(dsr, totalSeconds);
	const futureValue = rmul(deposit * RAY / WAD, rateMultiplier) * WAD / RAY;
	const earnings = futureValue - deposit;
	
	return {
		futureValue,
		earnings,
		apy: calculateDsrApy(dsr),
	};
}

/**
 * Format DSR info for display
 */
export function formatDsrInfo(dsrInfo: DsrInfo): {
	currentApy: string;
	totalDaiDeposited: string;
	chi: string;
	lastUpdate: string;
} {
	const apy = calculateDsrApy(dsrInfo.dsr);
	const currentChi = calculateCurrentChi(dsrInfo.chi, dsrInfo.dsr, dsrInfo.rho);
	const totalDai = pieToDai(dsrInfo.pie, currentChi);
	
	return {
		currentApy: `${apy.toFixed(2)}%`,
		totalDaiDeposited: fromWad(totalDai).toFixed(2),
		chi: fromRay(currentChi).toFixed(27),
		lastUpdate: new Date(Number(dsrInfo.rho) * 1000).toISOString(),
	};
}

/**
 * POT (DSR) Contract ABI
 */
export const POT_ABI = [
	// Read functions
	'function dsr() view returns (uint256)',
	'function chi() view returns (uint256)',
	'function rho() view returns (uint256)',
	'function pie(address) view returns (uint256)',
	'function Pie() view returns (uint256)',
	'function vat() view returns (address)',
	'function vow() view returns (address)',
	'function live() view returns (uint256)',
	
	// Write functions
	'function drip() returns (uint256)',
	'function join(uint256)',
	'function exit(uint256)',
	
	// Events
	'event LogNote(bytes4 indexed sig, address indexed usr, bytes32 indexed arg1, bytes32 indexed arg2, bytes data)',
];

/**
 * DsrManager ABI - Simplified DSR interactions
 */
export const DSR_MANAGER_ABI = [
	'function pot() view returns (address)',
	'function daiJoin() view returns (address)',
	'function dai() view returns (address)',
	'function pieOf(address) view returns (uint256)',
	
	'function join(address dst, uint256 wad)',
	'function exit(address dst, uint256 wad)',
	'function exitAll(address dst)',
];

/**
 * sDAI (Savings DAI) ERC-4626 Vault ABI
 * sDAI is an ERC-4626 tokenized vault that wraps DSR functionality
 */
export const SDAI_ABI = [
	// ERC-20 standard
	'function name() view returns (string)',
	'function symbol() view returns (string)',
	'function decimals() view returns (uint8)',
	'function totalSupply() view returns (uint256)',
	'function balanceOf(address) view returns (uint256)',
	'function allowance(address, address) view returns (uint256)',
	'function approve(address, uint256) returns (bool)',
	'function transfer(address, uint256) returns (bool)',
	'function transferFrom(address, address, uint256) returns (bool)',
	
	// ERC-4626 vault standard
	'function asset() view returns (address)',
	'function totalAssets() view returns (uint256)',
	'function convertToShares(uint256 assets) view returns (uint256)',
	'function convertToAssets(uint256 shares) view returns (uint256)',
	'function maxDeposit(address) view returns (uint256)',
	'function maxMint(address) view returns (uint256)',
	'function maxWithdraw(address) view returns (uint256)',
	'function maxRedeem(address) view returns (uint256)',
	'function previewDeposit(uint256 assets) view returns (uint256)',
	'function previewMint(uint256 shares) view returns (uint256)',
	'function previewWithdraw(uint256 assets) view returns (uint256)',
	'function previewRedeem(uint256 shares) view returns (uint256)',
	
	// Write functions
	'function deposit(uint256 assets, address receiver) returns (uint256)',
	'function mint(uint256 shares, address receiver) returns (uint256)',
	'function withdraw(uint256 assets, address receiver, address owner) returns (uint256)',
	'function redeem(uint256 shares, address receiver, address owner) returns (uint256)',
	
	// Permit (gasless approval)
	'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)',
	'function nonces(address) view returns (uint256)',
	'function DOMAIN_SEPARATOR() view returns (bytes32)',
	
	// Events
	'event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)',
	'event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)',
];

/**
 * SSR (Sky Savings Rate) for USDS
 */
export const SSR_ABI = [
	// Similar to sDAI but for USDS
	'function name() view returns (string)',
	'function symbol() view returns (string)',
	'function decimals() view returns (uint8)',
	'function totalSupply() view returns (uint256)',
	'function balanceOf(address) view returns (uint256)',
	'function asset() view returns (address)',
	'function totalAssets() view returns (uint256)',
	'function convertToShares(uint256 assets) view returns (uint256)',
	'function convertToAssets(uint256 shares) view returns (uint256)',
	'function deposit(uint256 assets, address receiver) returns (uint256)',
	'function withdraw(uint256 assets, address receiver, address owner) returns (uint256)',
	'function redeem(uint256 shares, address receiver, address owner) returns (uint256)',
];

/**
 * Calculate sDAI exchange rate
 */
export function calculateSdaiExchangeRate(totalAssets: bigint, totalShares: bigint): number {
	if (totalShares === 0n) return 1;
	return fromWad(totalAssets) / fromWad(totalShares);
}

/**
 * Convert sDAI to DAI value
 */
export function sdaiToDaiValue(sdaiAmount: bigint, exchangeRate: number): bigint {
	return toWad(fromWad(sdaiAmount) * exchangeRate);
}

/**
 * Convert DAI to sDAI shares
 */
export function daiToSdaiShares(daiAmount: bigint, exchangeRate: number): bigint {
	return toWad(fromWad(daiAmount) / exchangeRate);
}
