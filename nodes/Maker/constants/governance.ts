/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Governance Contract Addresses and Constants
 * 
 * Maker governance consists of:
 * - Executive Votes (DSChief) - On-chain voting with MKR
 * - Polls (Polling) - Off-chain signaling
 * - Delegates - MKR delegation system
 * - Spells - Smart contracts that execute governance decisions
 */

export interface GovernanceAddresses {
	chief: string;
	polling: string;
	iou: string;
	pause: string;
	pauseProxy: string;
	voteDelegate: string;
	voteDelegateFactory: string;
	mkr: string;
}

export const GOVERNANCE_CONTRACTS: GovernanceAddresses = {
	// DSChief - Main voting contract
	chief: '0x0a3f6849f78076aefaDf113F5BED87720274dDC0',
	
	// Polling - Off-chain poll voting
	polling: '0xD3A9FE267852281a1e6307a1C37CDfD76d39b133',
	
	// IOU Token - Represents locked MKR in voting
	iou: '0x496C67A4CEd9C453A60F3166AB4B329870c8E355',
	
	// Pause - Governance delay contract
	pause: '0xbE286431454714F511008713973d3B053A2d38f3',
	
	// Pause Proxy - Executes spells after delay
	pauseProxy: '0xBE8E3e3618f7474F8cB1d074A26afFef007E98FB',
	
	// Vote Delegate - Individual delegate contract
	voteDelegate: '0x0000000000000000000000000000000000000000', // Dynamic per delegate
	
	// Vote Delegate Factory - Creates delegate contracts
	voteDelegateFactory: '0xD897F108670903D1d6070fcf818f9db3615AF272',
	
	// MKR Token
	mkr: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
};

// DSChief ABI
export const CHIEF_ABI = [
	// Read functions
	'function GOV() view returns (address)',
	'function IOU() view returns (address)',
	'function approvals(address) view returns (uint256)',
	'function deposits(address) view returns (uint256)',
	'function hat() view returns (address)',
	'function last(address) view returns (uint256)',
	'function slates(bytes32, uint256) view returns (address)',
	'function votes(address) view returns (bytes32)',
	'function live() view returns (uint256)',
	'function MAX_YAYS() view returns (uint256)',
	'function isUserRoot(address) view returns (bool)',
	
	// Write functions
	'function lock(uint256 wad)',
	'function free(uint256 wad)',
	'function vote(address[] yays) returns (bytes32)',
	'function vote(bytes32 slate)',
	'function etch(address[] yays) returns (bytes32)',
	'function lift(address whom)',
	
	// Events
	'event LogNote(bytes4 indexed sig, address indexed guy, bytes32 indexed foo, bytes32 indexed bar, uint256 wad, bytes fax)',
	'event Etch(bytes32 indexed slate)',
];

// Polling ABI
export const POLLING_ABI = [
	'function polls(uint256) view returns (uint256 startDate, uint256 endDate, string url, uint256 blockCreated)',
	'function lastPollId() view returns (uint256)',
	'function vote(uint256 pollId, uint256 optionId)',
	'function vote(uint256[] pollIds, uint256[] optionIds)',
	'function withdraw(uint256 pollId)',
	'function hasUserVoted(uint256 pollId, address voter) view returns (bool)',
	'function getVoteOption(uint256 pollId, address voter) view returns (uint256)',
	
	'event PollCreated(address indexed creator, uint256 blockCreated, uint256 indexed pollId, uint256 startDate, uint256 endDate, string multiHash, string url)',
	'event Voted(address indexed voter, uint256 indexed pollId, uint256 indexed optionId)',
];

// Vote Delegate Factory ABI
export const DELEGATE_FACTORY_ABI = [
	'function create() returns (address delegate)',
	'function isDelegate(address) view returns (bool)',
	'function delegates(address) view returns (address)',
	
	'event CreateVoteDelegate(address indexed delegate, address indexed owner)',
];

// Vote Delegate ABI
export const DELEGATE_ABI = [
	'function lock(uint256 wad)',
	'function free(uint256 wad)',
	'function vote(address[] yays) returns (bytes32)',
	'function vote(bytes32 slate)',
	
	'function chief() view returns (address)',
	'function polling() view returns (address)',
	'function gov() view returns (address)',
	'function iou() view returns (address)',
];

// IOU Token ABI
export const IOU_ABI = [
	'function name() view returns (string)',
	'function symbol() view returns (string)',
	'function decimals() view returns (uint8)',
	'function totalSupply() view returns (uint256)',
	'function balanceOf(address) view returns (uint256)',
	'function allowance(address, address) view returns (uint256)',
];

// Poll voting options
export enum PollOption {
	ABSTAIN = 0,
	YES = 1,
	NO = 2,
}

// Governance API endpoints
export const GOVERNANCE_API = {
	// Official Maker governance portal API
	portal: 'https://vote.makerdao.com/api',
	
	// Governance subgraph
	subgraph: 'https://api.thegraph.com/subgraphs/name/protofire/makerdao-governance',
	
	// Executive votes API
	executives: 'https://vote.makerdao.com/api/executive',
	
	// Polls API
	polls: 'https://vote.makerdao.com/api/polling',
	
	// Delegates API
	delegates: 'https://vote.makerdao.com/api/delegates',
};

// Known active spells (example - these change frequently)
export const EXAMPLE_SPELLS = {
	// These are examples - actual spells change with governance
	placeholder: '0x0000000000000000000000000000000000000000',
};

// Governance parameters
export const GOVERNANCE_PARAMS = {
	// GSM (Governance Security Module) delay in seconds
	gsmDelay: 48 * 60 * 60, // 48 hours
	
	// Minimum MKR required to create executive
	minMkrToPropose: 0, // Currently no minimum
	
	// Executive voting period (no fixed period - continuous)
	executiveVotingPeriod: null,
	
	// Poll minimum duration (seconds)
	pollMinDuration: 3 * 24 * 60 * 60, // 3 days
};
