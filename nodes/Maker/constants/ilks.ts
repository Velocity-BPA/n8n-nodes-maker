/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Ilk (Collateral Type) Constants
 * 
 * In Maker Protocol, "ilk" is a bytes32 identifier for each collateral type
 * Each ilk has its own risk parameters (liquidation ratio, stability fee, etc.)
 */

export interface IlkInfo {
	name: string;
	ilkBytes32: string;
	symbol: string;
	decimals: number;
	tokenAddress: string;
	joinAddress: string;
	flipAddress?: string;   // Legacy liquidation
	clipAddress?: string;   // Liquidation 2.0
	pipAddress: string;     // Price feed
	description: string;
	category: 'crypto' | 'rwa' | 'stablecoin' | 'lp';
	isActive: boolean;
}

// Convert string to bytes32
export function stringToBytes32(text: string): string {
	const hex = Buffer.from(text, 'utf8').toString('hex');
	return '0x' + hex.padEnd(64, '0');
}

// Common ilk identifiers
export const ILKS = {
	// ETH collaterals
	'ETH-A': stringToBytes32('ETH-A'),
	'ETH-B': stringToBytes32('ETH-B'),
	'ETH-C': stringToBytes32('ETH-C'),
	
	// WBTC collaterals
	'WBTC-A': stringToBytes32('WBTC-A'),
	'WBTC-B': stringToBytes32('WBTC-B'),
	'WBTC-C': stringToBytes32('WBTC-C'),
	
	// Stablecoins
	'USDC-A': stringToBytes32('USDC-A'),
	'USDC-B': stringToBytes32('USDC-B'),
	'TUSD-A': stringToBytes32('TUSD-A'),
	'GUSD-A': stringToBytes32('GUSD-A'),
	'USDP-A': stringToBytes32('USDP-A'),
	'USDT-A': stringToBytes32('USDT-A'),
	
	// LP tokens
	'UNIV2DAIETH-A': stringToBytes32('UNIV2DAIETH-A'),
	'UNIV2USDCETH-A': stringToBytes32('UNIV2USDCETH-A'),
	'UNIV2WBTCETH-A': stringToBytes32('UNIV2WBTCETH-A'),
	
	// Other cryptos
	'LINK-A': stringToBytes32('LINK-A'),
	'MATIC-A': stringToBytes32('MATIC-A'),
	'MANA-A': stringToBytes32('MANA-A'),
	'YFI-A': stringToBytes32('YFI-A'),
	'COMP-A': stringToBytes32('COMP-A'),
	'AAVE-A': stringToBytes32('AAVE-A'),
	'BAL-A': stringToBytes32('BAL-A'),
	'UNI-A': stringToBytes32('UNI-A'),
	'RENBTC-A': stringToBytes32('RENBTC-A'),
	'WSTETH-A': stringToBytes32('WSTETH-A'),
	'WSTETH-B': stringToBytes32('WSTETH-B'),
	'RETH-A': stringToBytes32('RETH-A'),
	'GNO-A': stringToBytes32('GNO-A'),
	'CRVV1ETHSTETH-A': stringToBytes32('CRVV1ETHSTETH-A'),
	
	// Real World Assets (RWA)
	'RWA001-A': stringToBytes32('RWA001-A'),
	'RWA002-A': stringToBytes32('RWA002-A'),
	'RWA003-A': stringToBytes32('RWA003-A'),
	'RWA004-A': stringToBytes32('RWA004-A'),
	'RWA005-A': stringToBytes32('RWA005-A'),
	'RWA006-A': stringToBytes32('RWA006-A'),
	'RWA007-A': stringToBytes32('RWA007-A'),
	'RWA008-A': stringToBytes32('RWA008-A'),
	'RWA009-A': stringToBytes32('RWA009-A'),
	'RWA010-A': stringToBytes32('RWA010-A'),
	'RWA011-A': stringToBytes32('RWA011-A'),
	'RWA012-A': stringToBytes32('RWA012-A'),
	'RWA013-A': stringToBytes32('RWA013-A'),
	'RWA014-A': stringToBytes32('RWA014-A'),
	'RWA015-A': stringToBytes32('RWA015-A'),
	
	// PSM
	'PSM-USDC-A': stringToBytes32('PSM-USDC-A'),
	'PSM-GUSD-A': stringToBytes32('PSM-GUSD-A'),
	'PSM-USDP-A': stringToBytes32('PSM-USDP-A'),
	
	// Direct Deposit Module (D3M)
	'DIRECT-AAVEV2-DAI': stringToBytes32('DIRECT-AAVEV2-DAI'),
	'DIRECT-COMPV2-DAI': stringToBytes32('DIRECT-COMPV2-DAI'),
	'DIRECT-SPARK-DAI': stringToBytes32('DIRECT-SPARK-DAI'),
};

// Detailed ilk information
export const ILK_INFO: Record<string, IlkInfo> = {
	'ETH-A': {
		name: 'ETH-A',
		ilkBytes32: ILKS['ETH-A'],
		symbol: 'WETH',
		decimals: 18,
		tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
		joinAddress: '0x2F0b23f53734252Bda2277357e97e1517d6B042A',
		clipAddress: '0xc67963a226eddd77B91aD8c421630A1b0AdFF270',
		pipAddress: '0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763',
		description: 'Wrapped Ether (standard risk profile)',
		category: 'crypto',
		isActive: true,
	},
	'ETH-B': {
		name: 'ETH-B',
		ilkBytes32: ILKS['ETH-B'],
		symbol: 'WETH',
		decimals: 18,
		tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
		joinAddress: '0x08638eF1A205bE6762A8b935F5da9b700Cf7322c',
		clipAddress: '0x71eb894330e8a4b96b8d6056962e7F116F50e06F',
		pipAddress: '0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763',
		description: 'Wrapped Ether (high risk profile - lower LR)',
		category: 'crypto',
		isActive: true,
	},
	'ETH-C': {
		name: 'ETH-C',
		ilkBytes32: ILKS['ETH-C'],
		symbol: 'WETH',
		decimals: 18,
		tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
		joinAddress: '0xF04a5cC80B1E94C69B48f5ee68a08CD2F09A7c3E',
		clipAddress: '0xc2b12567523e3f3CBd9931492b91fe65b240bc47',
		pipAddress: '0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763',
		description: 'Wrapped Ether (low risk profile - higher LR)',
		category: 'crypto',
		isActive: true,
	},
	'WBTC-A': {
		name: 'WBTC-A',
		ilkBytes32: ILKS['WBTC-A'],
		symbol: 'WBTC',
		decimals: 8,
		tokenAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
		joinAddress: '0xBF72Da2Bd84c5170618Fbe5914B0ECA9638d5eb5',
		clipAddress: '0x0227b54AdbFAEec5f1eD1dFa11f54dcff9076e2C',
		pipAddress: '0xf185d0682d50819263941e5f4EacC763CC5C6C42',
		description: 'Wrapped Bitcoin',
		category: 'crypto',
		isActive: true,
	},
	'WSTETH-A': {
		name: 'WSTETH-A',
		ilkBytes32: ILKS['WSTETH-A'],
		symbol: 'wstETH',
		decimals: 18,
		tokenAddress: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
		joinAddress: '0x10CD5fbe1b404B7E19Ef964B63939907bdaf42E2',
		clipAddress: '0x49A33A28C4C7D9576ab28898F4C9ac7e52EA457A',
		pipAddress: '0xFe7a2aC0B945f12089aEEB6eCebf4F384D9f043F',
		description: 'Lido Wrapped Staked ETH',
		category: 'crypto',
		isActive: true,
	},
	'RETH-A': {
		name: 'RETH-A',
		ilkBytes32: ILKS['RETH-A'],
		symbol: 'rETH',
		decimals: 18,
		tokenAddress: '0xae78736Cd615f374D3085123A210448E74Fc6393',
		joinAddress: '0xc6424e862f1462BF02c43b2f2E6BFEfC7De4F8E1',
		clipAddress: '0x27CA5E525ea473eD52Ea9423CD08C1a37D6Ea355',
		pipAddress: '0xeE7F0b350aA119b3d05DC733a4621a81972f7D47',
		description: 'Rocket Pool ETH',
		category: 'crypto',
		isActive: true,
	},
	'PSM-USDC-A': {
		name: 'PSM-USDC-A',
		ilkBytes32: ILKS['PSM-USDC-A'],
		symbol: 'USDC',
		decimals: 6,
		tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
		joinAddress: '0x0A59649758aa4d66E25f08Dd01271e891fe52199',
		pipAddress: '0x77b68899b99b686F415d074278a9a16b336085A0',
		description: 'Peg Stability Module - USDC',
		category: 'stablecoin',
		isActive: true,
	},
};

// Get ilk bytes32 from string
export function getIlkBytes32(ilkName: string): string {
	return ILKS[ilkName] || stringToBytes32(ilkName);
}

// Get ilk info
export function getIlkInfo(ilkName: string): IlkInfo | undefined {
	return ILK_INFO[ilkName];
}

// List all supported ilks
export function getSupportedIlks(): string[] {
	return Object.keys(ILKS);
}

// List active ilks
export function getActiveIlks(): string[] {
	return Object.entries(ILK_INFO)
		.filter(([_, info]) => info.isActive)
		.map(([name]) => name);
}
