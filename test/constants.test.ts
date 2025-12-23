import {
  MAINNET_CONTRACTS,
  NETWORK_CONFIG,
  DEFAULT_RPC_URLS,
  L2_CONTRACTS,
  SPARK_CONTRACTS,
} from '../nodes/Maker/constants/contracts';

import {
  ILKS,
  ILK_INFO,
  stringToBytes32,
  getIlkBytes32,
  getIlkInfo,
  getSupportedIlks,
  getActiveIlks,
} from '../nodes/Maker/constants/ilks';

import {
  ORACLES,
  getOracleForIlk,
  formatOraclePrice,
} from '../nodes/Maker/constants/oracles';

import {
  GOVERNANCE_CONTRACTS,
  GOVERNANCE_API,
  GOVERNANCE_PARAMS,
} from '../nodes/Maker/constants/governance';

describe('Contract Constants', () => {
  describe('MAINNET_CONTRACTS', () => {
    it('should have valid Ethereum addresses', () => {
      const addressRegex = /^0x[a-fA-F0-9]{40}$/;
      
      expect(MAINNET_CONTRACTS.dai).toMatch(addressRegex);
      expect(MAINNET_CONTRACTS.mkr).toMatch(addressRegex);
      expect(MAINNET_CONTRACTS.vat).toMatch(addressRegex);
      expect(MAINNET_CONTRACTS.pot).toMatch(addressRegex);
      expect(MAINNET_CONTRACTS.sdai).toMatch(addressRegex);
    });

    it('should have all core MCD contracts', () => {
      expect(MAINNET_CONTRACTS.vat).toBeDefined();
      expect(MAINNET_CONTRACTS.jug).toBeDefined();
      expect(MAINNET_CONTRACTS.pot).toBeDefined();
      expect(MAINNET_CONTRACTS.spot).toBeDefined();
      expect(MAINNET_CONTRACTS.dog).toBeDefined();
      expect(MAINNET_CONTRACTS.vow).toBeDefined();
    });

    it('should have Sky Protocol contracts', () => {
      expect(MAINNET_CONTRACTS.usds).toBeDefined();
      expect(MAINNET_CONTRACTS.sky).toBeDefined();
      expect(MAINNET_CONTRACTS.daiUsds).toBeDefined();
      expect(MAINNET_CONTRACTS.mkrSky).toBeDefined();
    });
  });

  describe('NETWORK_CONFIG', () => {
    it('should have mainnet configuration', () => {
      expect(NETWORK_CONFIG.mainnet).toBeDefined();
      expect(NETWORK_CONFIG.mainnet.chainId).toBe(1);
      expect(NETWORK_CONFIG.mainnet.name).toBe('Ethereum Mainnet');
    });

    it('should have L2 configurations', () => {
      expect(NETWORK_CONFIG.arbitrum.chainId).toBe(42161);
      expect(NETWORK_CONFIG.optimism.chainId).toBe(10);
      expect(NETWORK_CONFIG.polygon.chainId).toBe(137);
      expect(NETWORK_CONFIG.base.chainId).toBe(8453);
    });
  });

  describe('DEFAULT_RPC_URLS', () => {
    it('should have URLs for all networks', () => {
      expect(DEFAULT_RPC_URLS.mainnet).toContain('http');
      expect(DEFAULT_RPC_URLS.arbitrum).toContain('http');
      expect(DEFAULT_RPC_URLS.optimism).toContain('http');
    });
  });

  describe('L2_CONTRACTS', () => {
    it('should have DAI addresses for each L2', () => {
      expect(L2_CONTRACTS.arbitrum.dai).toBeDefined();
      expect(L2_CONTRACTS.optimism.dai).toBeDefined();
      expect(L2_CONTRACTS.polygon.dai).toBeDefined();
      expect(L2_CONTRACTS.base.dai).toBeDefined();
    });
  });

  describe('SPARK_CONTRACTS', () => {
    it('should have Spark Protocol addresses', () => {
      expect(SPARK_CONTRACTS.pool).toBeDefined();
      expect(SPARK_CONTRACTS.poolDataProvider).toBeDefined();
      expect(SPARK_CONTRACTS.sDAI).toBeDefined();
    });
  });
});

describe('Ilk Constants', () => {
  describe('stringToBytes32', () => {
    it('should convert string to bytes32', () => {
      const result = stringToBytes32('ETH-A');
      expect(result.startsWith('0x')).toBe(true);
      expect(result.length).toBe(66); // 0x + 64 hex chars
    });

    it('should pad short strings', () => {
      const result = stringToBytes32('A');
      expect(result.endsWith('0'.repeat(62))).toBe(true);
    });
  });

  describe('ILKS', () => {
    it('should have common ilks defined', () => {
      expect(ILKS['ETH-A']).toBeDefined();
      expect(ILKS['ETH-B']).toBeDefined();
      expect(ILKS['WBTC-A']).toBeDefined();
      expect(ILKS['PSM-USDC-A']).toBeDefined();
    });

    it('should have valid bytes32 format', () => {
      Object.values(ILKS).forEach(ilk => {
        expect(ilk.startsWith('0x')).toBe(true);
        expect(ilk.length).toBe(66);
      });
    });
  });

  describe('ILK_INFO', () => {
    it('should have info for ETH-A', () => {
      const ethA = ILK_INFO['ETH-A'];
      expect(ethA).toBeDefined();
      expect(ethA.symbol).toBe('WETH');
      expect(ethA.decimals).toBe(18);
      expect(ethA.category).toBe('crypto');
      expect(ethA.isActive).toBe(true);
    });

    it('should have valid token addresses', () => {
      const addressRegex = /^0x[a-fA-F0-9]{40}$/;
      Object.values(ILK_INFO).forEach(info => {
        expect(info.tokenAddress).toMatch(addressRegex);
        expect(info.joinAddress).toMatch(addressRegex);
      });
    });
  });

  describe('getIlkBytes32', () => {
    it('should return bytes32 for known ilk', () => {
      expect(getIlkBytes32('ETH-A')).toBe(ILKS['ETH-A']);
    });

    it('should generate bytes32 for unknown ilk', () => {
      const result = getIlkBytes32('UNKNOWN-A');
      expect(result.startsWith('0x')).toBe(true);
    });
  });

  describe('getIlkInfo', () => {
    it('should return info for known ilk', () => {
      const info = getIlkInfo('ETH-A');
      expect(info).toBeDefined();
      expect(info?.name).toBe('ETH-A');
    });

    it('should return undefined for unknown ilk', () => {
      const info = getIlkInfo('UNKNOWN-A');
      expect(info).toBeUndefined();
    });
  });

  describe('getSupportedIlks', () => {
    it('should return array of ilk names', () => {
      const ilks = getSupportedIlks();
      expect(Array.isArray(ilks)).toBe(true);
      expect(ilks).toContain('ETH-A');
      expect(ilks).toContain('WBTC-A');
    });
  });

  describe('getActiveIlks', () => {
    it('should return only active ilks', () => {
      const activeIlks = getActiveIlks();
      activeIlks.forEach(ilkName => {
        const info = getIlkInfo(ilkName);
        expect(info?.isActive).toBe(true);
      });
    });
  });
});

describe('Oracle Constants', () => {
  describe('ORACLES', () => {
    it('should have oracle info for major assets', () => {
      expect(ORACLES.ETH).toBeDefined();
      expect(ORACLES.WBTC).toBeDefined();
    });

    it('should have valid addresses', () => {
      const addressRegex = /^0x[a-fA-F0-9]{40}$/;
      Object.values(ORACLES).forEach(oracle => {
        expect(oracle.medianizer).toMatch(addressRegex);
        expect(oracle.osm).toMatch(addressRegex);
      });
    });
  });

  describe('getOracleForIlk', () => {
    it('should return ETH oracle for ETH-A', () => {
      const oracle = getOracleForIlk('ETH-A');
      expect(oracle).toBe(ORACLES.ETH);
    });

    it('should return WBTC oracle for WBTC-A', () => {
      const oracle = getOracleForIlk('WBTC-A');
      expect(oracle).toBe(ORACLES.WBTC);
    });

    it('should return undefined for unknown ilk', () => {
      const oracle = getOracleForIlk('UNKNOWN-A');
      expect(oracle).toBeUndefined();
    });
  });

  describe('formatOraclePrice', () => {
    it('should format bytes32 price to decimal', () => {
      // Price of $2000 in 18 decimals
      const priceBytes32 = '0x' + (2000n * 10n ** 18n).toString(16).padStart(64, '0');
      const formatted = formatOraclePrice(priceBytes32);
      expect(parseFloat(formatted)).toBeCloseTo(2000, 0);
    });
  });
});

describe('Governance Constants', () => {
  describe('GOVERNANCE_CONTRACTS', () => {
    it('should have valid addresses', () => {
      const addressRegex = /^0x[a-fA-F0-9]{40}$/;
      expect(GOVERNANCE_CONTRACTS.chief).toMatch(addressRegex);
      expect(GOVERNANCE_CONTRACTS.polling).toMatch(addressRegex);
      expect(GOVERNANCE_CONTRACTS.mkr).toMatch(addressRegex);
    });
  });

  describe('GOVERNANCE_API', () => {
    it('should have valid API endpoints', () => {
      expect(GOVERNANCE_API.portal).toContain('http');
      expect(GOVERNANCE_API.executives).toContain('http');
      expect(GOVERNANCE_API.polls).toContain('http');
    });
  });

  describe('GOVERNANCE_PARAMS', () => {
    it('should have GSM delay', () => {
      expect(GOVERNANCE_PARAMS.gsmDelay).toBe(48 * 60 * 60); // 48 hours
    });

    it('should have poll minimum duration', () => {
      expect(GOVERNANCE_PARAMS.pollMinDuration).toBe(3 * 24 * 60 * 60); // 3 days
    });
  });
});
