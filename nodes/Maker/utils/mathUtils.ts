/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Maker Protocol Math Utilities
 * 
 * The Maker protocol uses three different precision levels:
 * - WAD: 10^18 (18 decimals) - Used for token amounts
 * - RAY: 10^27 (27 decimals) - Used for rates and ratios
 * - RAD: 10^45 (45 decimals) - Used for internal accounting
 * 
 * These are fixed-point decimal representations stored as integers.
 */

// Precision constants
export const WAD = BigInt('1000000000000000000'); // 10^18
export const RAY = BigInt('1000000000000000000000000000'); // 10^27
export const RAD = BigInt('1000000000000000000000000000000000000000000000'); // 10^45

// Precision as numbers for easier calculations
export const WAD_DECIMALS = 18;
export const RAY_DECIMALS = 27;
export const RAD_DECIMALS = 45;

/**
 * Convert a decimal number to WAD (10^18)
 */
export function toWad(value: number | string): bigint {
	const num = typeof value === 'string' ? parseFloat(value) : value;
	return BigInt(Math.floor(num * 1e18));
}

/**
 * Convert WAD to decimal number
 */
export function fromWad(wad: bigint | string): number {
	const value = typeof wad === 'string' ? BigInt(wad) : wad;
	return Number(value) / 1e18;
}

/**
 * Format WAD as string with specified decimals
 */
export function formatWad(wad: bigint | string, decimals: number = 4): string {
	return fromWad(wad).toFixed(decimals);
}

/**
 * Convert a decimal number to RAY (10^27)
 */
export function toRay(value: number | string): bigint {
	const num = typeof value === 'string' ? parseFloat(value) : value;
	// Use string manipulation to avoid floating point precision issues
	const [integer, decimal = ''] = num.toString().split('.');
	const paddedDecimal = decimal.padEnd(27, '0').slice(0, 27);
	return BigInt(integer + paddedDecimal);
}

/**
 * Convert RAY to decimal number
 */
export function fromRay(ray: bigint | string): number {
	const value = typeof ray === 'string' ? BigInt(ray) : ray;
	return Number(value) / 1e27;
}

/**
 * Format RAY as string with specified decimals
 */
export function formatRay(ray: bigint | string, decimals: number = 8): string {
	return fromRay(ray).toFixed(decimals);
}

/**
 * Convert a decimal number to RAD (10^45)
 */
export function toRad(value: number | string): bigint {
	const num = typeof value === 'string' ? parseFloat(value) : value;
	// RAD is so large we need to be careful
	const wadValue = toWad(num);
	return wadValue * RAY / WAD;
}

/**
 * Convert RAD to decimal number
 */
export function fromRad(rad: bigint | string): number {
	const value = typeof rad === 'string' ? BigInt(rad) : rad;
	// RAD is 45 decimals - too large for Number, divide first
	return Number(value / RAY) / 1e18;
}

/**
 * Format RAD as string with specified decimals
 */
export function formatRad(rad: bigint | string, decimals: number = 4): string {
	return fromRad(rad).toFixed(decimals);
}

/**
 * Multiply WAD values (a * b / WAD)
 */
export function wmul(a: bigint, b: bigint): bigint {
	return (a * b + WAD / 2n) / WAD;
}

/**
 * Divide WAD values (a * WAD / b)
 */
export function wdiv(a: bigint, b: bigint): bigint {
	return (a * WAD + b / 2n) / b;
}

/**
 * Multiply RAY values (a * b / RAY)
 */
export function rmul(a: bigint, b: bigint): bigint {
	return (a * b + RAY / 2n) / RAY;
}

/**
 * Divide RAY values (a * RAY / b)
 */
export function rdiv(a: bigint, b: bigint): bigint {
	return (a * RAY + b / 2n) / b;
}

/**
 * Calculate power of RAY (for compound interest)
 * rpow(x, n) = x^n in RAY precision
 */
export function rpow(x: bigint, n: bigint): bigint {
	let z = n % 2n !== 0n ? x : RAY;

	for (n = n / 2n; n !== 0n; n = n / 2n) {
		x = rmul(x, x);
		if (n % 2n !== 0n) {
			z = rmul(z, x);
		}
	}
	return z;
}

/**
 * Convert annual rate to per-second rate (RAY)
 * Maker stability fees are stored as per-second rates
 */
export function annualRateToPerSecond(annualRate: number): bigint {
	// rate = (1 + annualRate) ^ (1/secondsPerYear) in RAY
	const secondsPerYear = 365.25 * 24 * 60 * 60;
	const perSecondRate = Math.pow(1 + annualRate, 1 / secondsPerYear);
	return toRay(perSecondRate);
}

/**
 * Convert per-second rate to annual percentage
 */
export function perSecondToAnnualRate(perSecondRate: bigint): number {
	const secondsPerYear = 365.25 * 24 * 60 * 60;
	const rateDecimal = fromRay(perSecondRate);
	return (Math.pow(rateDecimal, secondsPerYear) - 1) * 100;
}

/**
 * Calculate accrued stability fee
 * fee = principal * (rate ^ time) - principal
 */
export function calculateAccruedFee(
	principal: bigint,
	rate: bigint,
	timeElapsed: bigint
): bigint {
	const accumulatedRate = rpow(rate, timeElapsed);
	return rmul(principal, accumulatedRate) - principal;
}

/**
 * Calculate DSR earnings
 * earnings = principal * chi - principal
 */
export function calculateDsrEarnings(
	principal: bigint,
	chi: bigint
): bigint {
	return rmul(principal, chi) - principal;
}

/**
 * Calculate collateralization ratio
 * ratio = (collateral * price) / debt
 */
export function calculateCollateralizationRatio(
	collateralWad: bigint,
	priceRay: bigint,
	debtWad: bigint
): number {
	if (debtWad === 0n) return Infinity;
	const collateralValue = rmul(collateralWad * RAY / WAD, priceRay);
	const ratio = collateralValue * 100n / (debtWad * RAY / WAD);
	return Number(ratio) / 100;
}

/**
 * Calculate liquidation price
 * liqPrice = debt * liquidationRatio / collateral
 */
export function calculateLiquidationPrice(
	collateralWad: bigint,
	debtWad: bigint,
	liquidationRatio: bigint // RAY format, e.g., 1.5 = 1.5 * RAY
): bigint {
	if (collateralWad === 0n) return 0n;
	return rdiv(rmul(debtWad * RAY / WAD, liquidationRatio), collateralWad * RAY / WAD);
}

/**
 * Calculate max DAI that can be generated
 * maxDai = (collateral * price) / liquidationRatio - currentDebt
 */
export function calculateMaxDai(
	collateralWad: bigint,
	priceRay: bigint,
	liquidationRatio: bigint,
	currentDebtWad: bigint
): bigint {
	const collateralValue = rmul(collateralWad * RAY / WAD, priceRay);
	const maxDebt = rdiv(collateralValue, liquidationRatio) * WAD / RAY;
	return maxDebt > currentDebtWad ? maxDebt - currentDebtWad : 0n;
}

/**
 * Calculate max collateral that can be withdrawn
 */
export function calculateMaxWithdraw(
	collateralWad: bigint,
	debtWad: bigint,
	priceRay: bigint,
	liquidationRatio: bigint
): bigint {
	const minCollateral = rdiv(rmul(debtWad * RAY / WAD, liquidationRatio), priceRay) * WAD / RAY;
	return collateralWad > minCollateral ? collateralWad - minCollateral : 0n;
}

/**
 * Convert sDAI to DAI using exchange rate
 * dai = sdai * exchangeRate
 */
export function sdaiToDai(sdaiWad: bigint, exchangeRateRay: bigint): bigint {
	return rmul(sdaiWad * RAY / WAD, exchangeRateRay) * WAD / RAY;
}

/**
 * Convert DAI to sDAI using exchange rate
 * sdai = dai / exchangeRate
 */
export function daiToSdai(daiWad: bigint, exchangeRateRay: bigint): bigint {
	return rdiv(daiWad * RAY / WAD, exchangeRateRay) * WAD / RAY;
}

/**
 * Parse a value with arbitrary decimals to a standard format
 */
export function parseDecimals(value: string, decimals: number): bigint {
	const [integer, decimal = ''] = value.split('.');
	const paddedDecimal = decimal.padEnd(decimals, '0').slice(0, decimals);
	return BigInt(integer + paddedDecimal);
}

/**
 * Format a value from arbitrary decimals to string
 */
export function formatDecimals(value: bigint, decimals: number, displayDecimals: number = 4): string {
	const divisor = BigInt(10 ** decimals);
	const integerPart = value / divisor;
	const decimalPart = value % divisor;
	const decimalStr = decimalPart.toString().padStart(decimals, '0');
	return `${integerPart}.${decimalStr.slice(0, displayDecimals)}`;
}
