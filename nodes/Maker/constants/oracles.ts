/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Oracle Contract Addresses
 * 
 * Maker uses a multi-layer oracle system:
 * 1. Medianizer - Aggregates prices from multiple feeds
 * 2. OSM (Oracle Security Module) - Adds a 1-hour delay for security
 * 3. Spotter - Converts oracle prices to protocol format
 */

export interface OracleInfo {
	name: string;
	medianizer: string;
	osm: string;
	decimals: number;
	description: string;
}

export const ORACLES: Record<string, OracleInfo> = {
	ETH: {
		name: 'ETH/USD',
		medianizer: '0x64DE91F5A373Cd4c28de3600cB34C7C6cE410C85',
		osm: '0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763',
		decimals: 18,
		description: 'Ethereum price oracle',
	},
	WBTC: {
		name: 'BTC/USD',
		medianizer: '0xe0F30cb149fAADC7247E953746Be9BbBB6B5751f',
		osm: '0xf185d0682d50819263941e5f4EacC763CC5C6C42',
		decimals: 18,
		description: 'Bitcoin price oracle',
	},
	LINK: {
		name: 'LINK/USD',
		medianizer: '0xbAd4212d73561B240f10C56F27e6D9608963f17b',
		osm: '0x9B0C694C6939b5EA9584e9b61C7815E8d97D9cC7',
		decimals: 18,
		description: 'Chainlink token price oracle',
	},
	YFI: {
		name: 'YFI/USD',
		medianizer: '0x89AC26C0aFCB28EC55B6CD2F6b7DAD867Fa24639',
		osm: '0x5F122465bCf86F45922036970Be6DD7F58820214',
		decimals: 18,
		description: 'Yearn Finance price oracle',
	},
	COMP: {
		name: 'COMP/USD',
		medianizer: '0xBED0879953E633135a48a157718Aa791AC0108E4',
		osm: '0xBED0879953E633135a48a157718Aa791AC0108E4',
		decimals: 18,
		description: 'Compound price oracle',
	},
	UNI: {
		name: 'UNI/USD',
		medianizer: '0xf363c7e351C96b910b92b45d34190650df4aE8e7',
		osm: '0xf363c7e351C96b910b92b45d34190650df4aE8e7',
		decimals: 18,
		description: 'Uniswap price oracle',
	},
	AAVE: {
		name: 'AAVE/USD',
		medianizer: '0x8Df8f06DC2dE0434db40dcBb32a82A104218754c',
		osm: '0x8Df8f06DC2dE0434db40dcBb32a82A104218754c',
		decimals: 18,
		description: 'Aave price oracle',
	},
	MATIC: {
		name: 'MATIC/USD',
		medianizer: '0xfe1D93E2a0dC4aF0d13423cDB6F2F87f0D tried',
		osm: '0x8874964279302e6d4e523Fb1789981C39a1034Ba',
		decimals: 18,
		description: 'Polygon/Matic price oracle',
	},
	WSTETH: {
		name: 'WSTETH/USD',
		medianizer: '0x2F73b6567B866302e132273f67661fB89b5a66F2',
		osm: '0xFe7a2aC0B945f12089aEEB6eCebf4F384D9f043F',
		decimals: 18,
		description: 'Lido Wrapped Staked ETH price oracle',
	},
	RETH: {
		name: 'RETH/USD',
		medianizer: '0xf86360f0127f8a441cfca332c75992d1c692b3d1',
		osm: '0xeE7F0b350aA119b3d05DC733a4621a81972f7D47',
		decimals: 18,
		description: 'Rocket Pool ETH price oracle',
	},
	GNO: {
		name: 'GNO/USD',
		medianizer: '0xd800ca44fFABecd159c7889c3bf64a217361AEc8',
		osm: '0xd800ca44fFABecd159c7889c3bf64a217361AEc8',
		decimals: 18,
		description: 'Gnosis price oracle',
	},
	// Stablecoin oracles (typically 1:1)
	USDC: {
		name: 'USDC/USD',
		medianizer: '0x77b68899b99b686F415d074278a9a16b336085A0',
		osm: '0x77b68899b99b686F415d074278a9a16b336085A0',
		decimals: 18,
		description: 'USDC price oracle (1:1 peg)',
	},
	GUSD: {
		name: 'GUSD/USD',
		medianizer: '0xf45Ae69CcA1b9B043dAE2C83A5B65Bc605BEc5F5',
		osm: '0xf45Ae69CcA1b9B043dAE2C83A5B65Bc605BEc5F5',
		decimals: 18,
		description: 'Gemini USD price oracle (1:1 peg)',
	},
	USDP: {
		name: 'USDP/USD',
		medianizer: '0x09b10E45A912BcD4E80a8A3119f0cfCcad1e1f12',
		osm: '0x09b10E45A912BcD4E80a8A3119f0cfCcad1e1f12',
		decimals: 18,
		description: 'Pax Dollar price oracle (1:1 peg)',
	},
};

// Oracle Security Module (OSM) ABI for price queries
export const OSM_ABI = [
	'function peek() view returns (bytes32, bool)',
	'function peep() view returns (bytes32, bool)',
	'function read() view returns (bytes32)',
	'function zzz() view returns (uint64)',
	'function hop() view returns (uint16)',
	'function src() view returns (address)',
	'function bud(address) view returns (uint256)',
	'event LogValue(bytes32 val)',
];

// Medianizer ABI
export const MEDIANIZER_ABI = [
	'function peek() view returns (bytes32, bool)',
	'function read() view returns (bytes32)',
	'function age() view returns (uint32)',
	'function wat() view returns (bytes32)',
	'function bar() view returns (uint256)',
	'function orcl(address) view returns (uint256)',
	'function bud(address) view returns (uint256)',
	'event LogMedianPrice(uint256 val, uint256 age)',
];

// Spotter ABI
export const SPOTTER_ABI = [
	'function vat() view returns (address)',
	'function par() view returns (uint256)',
	'function ilks(bytes32) view returns (address pip, uint256 mat)',
	'function poke(bytes32 ilk)',
	'event Poke(bytes32 ilk, bytes32 val, uint256 spot)',
];

// Get oracle for ilk
export function getOracleForIlk(ilkName: string): OracleInfo | undefined {
	// Extract base asset from ilk name (e.g., "ETH-A" -> "ETH")
	const baseAsset = ilkName.split('-')[0];
	return ORACLES[baseAsset];
}

// Format oracle price from bytes32
export function formatOraclePrice(priceBytes32: string): string {
	// Oracle prices are stored as bytes32, need to convert to decimal
	const priceBigInt = BigInt(priceBytes32);
	// Prices have 18 decimals
	return (Number(priceBigInt) / 1e18).toFixed(8);
}
