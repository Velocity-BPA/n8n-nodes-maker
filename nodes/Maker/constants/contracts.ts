/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Maker Protocol Contract Addresses
 * Multi-Collateral DAI (MCD) System Contracts
 * 
 * WAD = 10^18 (18 decimals) - Used for token amounts
 * RAY = 10^27 (27 decimals) - Used for rates
 * RAD = 10^45 (45 decimals) - Used for system accounting
 */

export interface NetworkContracts {
	// Core MCD Contracts
	vat: string;          // Core vault engine
	cat: string;          // Liquidation manager (legacy)
	dog: string;          // Liquidation manager 2.0
	vow: string;          // System surplus/debt
	jug: string;          // Stability fee collection
	pot: string;          // DSR contract
	spot: string;         // Oracle price feed
	dai: string;          // DAI token
	daiJoin: string;      // DAI adapter
	
	// Governance
	mkr: string;          // MKR token
	chief: string;        // Voting contract
	polling: string;      // Poll voting
	iou: string;          // IOU token
	pause: string;        // Governance delay
	
	// Sky Protocol (rebrand)
	usds: string;         // USDS token
	sky: string;          // SKY token
	usdsJoin: string;     // USDS adapter
	skyJoin: string;      // SKY adapter
	daiUsds: string;      // DAI/USDS converter
	mkrSky: string;       // MKR/SKY converter
	ssr: string;          // Sky Savings Rate
	
	// Savings
	sdai: string;         // sDAI (ERC-4626)
	susds: string;        // sUSDS (ERC-4626)
	
	// Flash Mint
	flash: string;        // Flash mint module
	
	// PSM (Peg Stability Module)
	psmUsdc: string;      // USDC PSM
	psmUsdcGem: string;   // USDC gem
	psmGusd: string;      // GUSD PSM
	psmUsdp: string;      // USDP PSM
	
	// DSProxy
	proxyRegistry: string;
	proxyActions: string;
	proxyActionsDsr: string;
	proxyActionsEnd: string;
	
	// CDP Manager
	cdpManager: string;
	getCdps: string;
	
	// Collateral Adapters (common)
	ethJoin: string;
	wbtcJoin: string;
	usdcJoin: string;
	
	// Oracles
	medianEth: string;
	osmEth: string;
	spotter: string;
	
	// End (Emergency Shutdown)
	end: string;
	esm: string;
	
	// Flap/Flop (Auctions)
	flap: string;         // Surplus auction
	flop: string;         // Debt auction
	
	// Multicall
	multicall: string;
	
	// Chainlog
	chainlog: string;
}

export const MAINNET_CONTRACTS: NetworkContracts = {
	// Core MCD
	vat: '0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B',
	cat: '0x78F2c2AF65126834c51822F56Be0d7469D7A523E',
	dog: '0x135954d155898D42C90D2a57824C690e0c7BEf1B',
	vow: '0xA950524441892A31ebddF91d3cEEFa04Bf454466',
	jug: '0x19c0976f590D67707E62397C87829d896Dc0f1F1',
	pot: '0x197E90f9FAD81970bA7976f33CbD77088E5D7cf7',
	spot: '0x65C79fcB50Ca1594B025960e539eD7A9a6D434A3',
	dai: '0x6B175474E89094C44Da98b954EescdeCB5BeF3823',
	daiJoin: '0x9759A6Ac90977b93B58547b4A71c78317f391A28',
	
	// Governance
	mkr: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
	chief: '0x0a3f6849f78076aefaDf113F5BED87720274dDC0',
	polling: '0xD3A9FE267852281a1e6307a1C37CDfD76d39b133',
	iou: '0x496C67A4CEd9C453A60F3166AB4B329870c8E355',
	pause: '0xbE286431454714F511008713973d3B053A2d38f3',
	
	// Sky Protocol
	usds: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
	sky: '0x56072C95FAA701256059aa122697B133aDEd9279',
	usdsJoin: '0x3C0f895007CA717Aa01c8693e59DF1e8C3777FEB',
	skyJoin: '0x0000000000000000000000000000000000000000', // TBD
	daiUsds: '0x3225737a9Bbb6473CB4a45b7244ACa2BeFdB276A',
	mkrSky: '0xBDcFCA946b6CDd965f99a839e4435Bcdc1bc470B',
	ssr: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD',
	
	// Savings
	sdai: '0x83F20F44975D03b1b09e64809B757c47f942BEeA',
	susds: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD',
	
	// Flash Mint
	flash: '0x1EB4CF3A948E7D72A198fe073cCb8C7a948cD853',
	
	// PSM
	psmUsdc: '0x89B78CfA322F6C5dE0aBcEecab66Aee45393cC5A',
	psmUsdcGem: '0x0A59649758aa4d66E25f08Dd01271e891fe52199',
	psmGusd: '0x204659B2Fd2aD5723975c362Ce2230Fba11d3900',
	psmUsdp: '0x961Ae24a1Ceba861D1FDf723794f6024Dc5485Cf',
	
	// DSProxy
	proxyRegistry: '0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4',
	proxyActions: '0x82ecD135Dce65Fbc6DbdD0e4237E0AF93FFD5038',
	proxyActionsDsr: '0x07ee93aEEa0a36FfF2A9B95dd22Bd6049EE54f26',
	proxyActionsEnd: '0x069B2fb501b6F16D1F5fE245B16F6993808f1008',
	
	// CDP Manager
	cdpManager: '0x5ef30b9986345249bc32d8928B7ee64DE9435E39',
	getCdps: '0x36a724Bd100c39f0Ea4D3A20F7097eE01A8Ff573',
	
	// Collateral Adapters
	ethJoin: '0x2F0b23f53734252Bda2277357e97e1517d6B042A',
	wbtcJoin: '0xBF72Da2Bd84c5170618Fbe5914B0ECA9638d5eb5',
	usdcJoin: '0x0A59649758aa4d66E25f08Dd01271e891fe52199',
	
	// Oracles
	medianEth: '0x64DE91F5A373Cd4c28de3600cB34C7C6cE410C85',
	osmEth: '0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763',
	spotter: '0x65C79fcB50Ca1594B025960e539eD7A9a6D434A3',
	
	// End
	end: '0x0e2e8F1D1326A4B9633D96222Ce399c708B19c28',
	esm: '0x09e05fF6142F2f9de8B6B65855A1d56B6cfE4c58',
	
	// Auctions
	flap: '0xC4269cC7acDEdC3794b221aA4D9205F564e27f0d',
	flop: '0xA41B6EF151E06da0e34B009B86E828308986736D',
	
	// Utilities
	multicall: '0xeefBa1e63905eF1D7ACbA5a8513c70307C1cE441',
	chainlog: '0xdA0Ab1e0017DEbCd72Be8599041a2aa3bA7e740F',
};

export const GOERLI_CONTRACTS: Partial<NetworkContracts> = {
	dai: '0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844',
	mkr: '0xc5E4eaB513A7CD12b2335e8a0D57273e13D499e7',
	vat: '0xB966002DDAa2Baf48369f5015329750019736031',
	pot: '0x50672F0a14571c62c9Af7a4632ce2D2eDf36afE0',
	chief: '0x33Ed584fc655b08b2bca45E1C5b5f07c98053bC1',
	proxyRegistry: '0x46759093D8158db8BB555aC7C6F98070c56169ce',
};

// L2 Bridge Contracts
export const L2_CONTRACTS = {
	arbitrum: {
		dai: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
		gateway: '0xD3B5b60020504bc3489D6949d545893982BA3011',
		router: '0x72Ce9c846789fdB6fC1f34aC4AD25Dd9ef7031ef',
	},
	optimism: {
		dai: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
		bridge: '0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65',
		l2Bridge: '0x10E6593CDda8c58a1d0f14C5164B376352a55f2F',
	},
	polygon: {
		dai: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
		bridge: '0xA0c68C638235ee32657e8f720a23ceC1bFc77C77',
	},
	base: {
		dai: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
		bridge: '0x3154Cf16ccdb4C6d922629664174b904d80F2C35',
	},
	gnosis: {
		xdai: '0x0000000000000000000000000000000000000000', // Native
		omni: '0x4aa42145Aa6Ebf72e164C9bBC74fbD3788045016',
	},
};

// Spark Protocol Contracts
export const SPARK_CONTRACTS = {
	pool: '0xC13e21B648A5Ee794902342038FF3aDAB66BE987',
	poolDataProvider: '0xFc21d6d146E6086B8359705C8b28512a983db0cb',
	oracle: '0x8105f69D9C41644c6A0803fDA7D03Aa70996cFD9',
	sDAI: '0x83F20F44975D03b1b09e64809B757c47f942BEeA',
	spk: '0x0000000000000000000000000000000000000000', // SPK token (upcoming)
};

// Network configurations
export const NETWORK_CONFIG = {
	mainnet: {
		chainId: 1,
		name: 'Ethereum Mainnet',
		rpcUrl: 'https://eth.llamarpc.com',
		explorer: 'https://etherscan.io',
		contracts: MAINNET_CONTRACTS,
	},
	goerli: {
		chainId: 5,
		name: 'Goerli Testnet',
		rpcUrl: 'https://goerli.infura.io/v3/public',
		explorer: 'https://goerli.etherscan.io',
		contracts: GOERLI_CONTRACTS,
	},
	sepolia: {
		chainId: 11155111,
		name: 'Sepolia Testnet',
		rpcUrl: 'https://sepolia.infura.io/v3/public',
		explorer: 'https://sepolia.etherscan.io',
		contracts: {},
	},
	arbitrum: {
		chainId: 42161,
		name: 'Arbitrum One',
		rpcUrl: 'https://arb1.arbitrum.io/rpc',
		explorer: 'https://arbiscan.io',
		contracts: L2_CONTRACTS.arbitrum,
	},
	optimism: {
		chainId: 10,
		name: 'Optimism',
		rpcUrl: 'https://mainnet.optimism.io',
		explorer: 'https://optimistic.etherscan.io',
		contracts: L2_CONTRACTS.optimism,
	},
	polygon: {
		chainId: 137,
		name: 'Polygon',
		rpcUrl: 'https://polygon-rpc.com',
		explorer: 'https://polygonscan.com',
		contracts: L2_CONTRACTS.polygon,
	},
	base: {
		chainId: 8453,
		name: 'Base',
		rpcUrl: 'https://mainnet.base.org',
		explorer: 'https://basescan.org',
		contracts: L2_CONTRACTS.base,
	},
	gnosis: {
		chainId: 100,
		name: 'Gnosis Chain',
		rpcUrl: 'https://rpc.gnosischain.com',
		explorer: 'https://gnosisscan.io',
		contracts: L2_CONTRACTS.gnosis,
	},
};

// Default public RPC endpoints
export const DEFAULT_RPC_URLS: Record<string, string> = {
	mainnet: 'https://eth.llamarpc.com',
	goerli: 'https://goerli.infura.io/v3/public',
	sepolia: 'https://sepolia.infura.io/v3/public',
	arbitrum: 'https://arb1.arbitrum.io/rpc',
	optimism: 'https://mainnet.optimism.io',
	polygon: 'https://polygon-rpc.com',
	base: 'https://mainnet.base.org',
	gnosis: 'https://rpc.gnosischain.com',
};
