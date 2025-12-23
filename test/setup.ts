// Jest setup file for n8n-nodes-maker tests

// Extend Jest timeout for blockchain operations
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock ethers provider for unit tests
jest.mock('ethers', () => {
  const actual = jest.requireActual('ethers');
  return {
    ...actual,
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getBlockNumber: jest.fn().mockResolvedValue(12345678),
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1n, name: 'mainnet' }),
      getFeeData: jest.fn().mockResolvedValue({ gasPrice: 20000000000n }),
    })),
  };
});

// Test utilities
export const mockCredentials = {
  makerNetwork: {
    network: 'mainnet',
    privateKey: '0x' + '1'.repeat(64),
    rpcUrl: 'https://eth.llamarpc.com',
    usePublicRpc: true,
  },
  subgraph: {
    subgraphType: 'maker',
    apiKey: '',
  },
};

export const mockAddresses = {
  testWallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f8b4Ed',
  daiContract: '0x6B175474E89094C44Da98b954EescdeCB5BeF3823',
  mkrContract: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
};
