import {
  WAD,
  RAY,
  RAD,
  toWad,
  fromWad,
  toRay,
  fromRay,
  toRad,
  fromRad,
  wmul,
  wdiv,
  rmul,
  rdiv,
  rpow,
  annualRateToPerSecond,
  perSecondToAnnualRate,
  calculateCollateralizationRatio,
  calculateLiquidationPrice,
  calculateMaxDai,
  sdaiToDai,
  daiToSdai,
} from '../nodes/Maker/utils/mathUtils';

describe('Math Utilities', () => {
  describe('WAD conversions', () => {
    it('should convert decimal to WAD', () => {
      expect(toWad(1)).toBe(WAD);
      expect(toWad(0.5)).toBe(WAD / 2n);
      expect(toWad(100)).toBe(100n * WAD);
    });

    it('should convert WAD to decimal', () => {
      expect(fromWad(WAD)).toBe(1);
      expect(fromWad(WAD / 2n)).toBe(0.5);
      expect(fromWad(100n * WAD)).toBe(100);
    });

    it('should handle string input', () => {
      expect(toWad('1.5')).toBe(toWad(1.5));
    });
  });

  describe('RAY conversions', () => {
    it('should convert decimal to RAY', () => {
      const oneRay = toRay(1);
      expect(oneRay).toBe(RAY);
    });

    it('should convert RAY to decimal', () => {
      expect(fromRay(RAY)).toBeCloseTo(1, 10);
      expect(fromRay(RAY * 2n)).toBeCloseTo(2, 10);
    });
  });

  describe('RAD conversions', () => {
    it('should convert decimal to RAD', () => {
      const oneRad = toRad(1);
      expect(oneRad).toBe(RAD);
    });

    it('should convert RAD to decimal', () => {
      expect(fromRad(RAD)).toBeCloseTo(1, 5);
    });
  });

  describe('WAD math operations', () => {
    it('should multiply WAD values', () => {
      const a = 2n * WAD;
      const b = 3n * WAD;
      const result = wmul(a, b);
      expect(fromWad(result)).toBeCloseTo(6, 10);
    });

    it('should divide WAD values', () => {
      const a = 6n * WAD;
      const b = 2n * WAD;
      const result = wdiv(a, b);
      expect(fromWad(result)).toBeCloseTo(3, 10);
    });
  });

  describe('RAY math operations', () => {
    it('should multiply RAY values', () => {
      const a = 2n * RAY;
      const b = 3n * RAY;
      const result = rmul(a, b);
      expect(fromRay(result)).toBeCloseTo(6, 10);
    });

    it('should divide RAY values', () => {
      const a = 6n * RAY;
      const b = 2n * RAY;
      const result = rdiv(a, b);
      expect(fromRay(result)).toBeCloseTo(3, 10);
    });

    it('should calculate power of RAY', () => {
      const base = toRay(1.05); // 5% rate
      const exponent = 2n;
      const result = rpow(base, exponent);
      expect(fromRay(result)).toBeCloseTo(1.1025, 5);
    });
  });

  describe('Rate conversions', () => {
    it('should convert annual rate to per-second rate', () => {
      const annualRate = 0.05; // 5%
      const perSecondRate = annualRateToPerSecond(annualRate);
      expect(perSecondRate).toBeGreaterThan(RAY);
    });

    it('should convert per-second rate to annual rate', () => {
      // DSR-like rate: 1.000000001547125957863212448
      const perSecondRate = 1000000001547125957863212448n;
      const annualRate = perSecondToAnnualRate(perSecondRate);
      expect(annualRate).toBeCloseTo(5, 1); // ~5%
    });
  });

  describe('Vault calculations', () => {
    it('should calculate collateralization ratio', () => {
      const collateral = toWad(10); // 10 ETH
      const price = toRay(2000); // $2000 per ETH
      const debt = toWad(10000); // 10000 DAI
      
      const ratio = calculateCollateralizationRatio(collateral, price, debt);
      expect(ratio).toBeCloseTo(2, 1); // 200%
    });

    it('should calculate liquidation price', () => {
      const collateral = toWad(10); // 10 ETH
      const debt = toWad(10000); // 10000 DAI
      const liquidationRatio = toRay(1.5); // 150%
      
      const liqPrice = calculateLiquidationPrice(collateral, debt, liquidationRatio);
      expect(fromRay(liqPrice)).toBeCloseTo(1500, 0); // $1500
    });

    it('should calculate max DAI that can be generated', () => {
      const collateral = toWad(10); // 10 ETH
      const price = toRay(2000); // $2000 per ETH
      const liquidationRatio = toRay(1.5); // 150%
      const currentDebt = toWad(5000); // 5000 DAI already borrowed
      
      const maxDai = calculateMaxDai(collateral, price, liquidationRatio, currentDebt);
      // Max = (10 * 2000) / 1.5 - 5000 = 13333.33 - 5000 = 8333.33
      expect(fromWad(maxDai)).toBeCloseTo(8333, 0);
    });

    it('should return 0 when at max debt', () => {
      const collateral = toWad(10);
      const price = toRay(2000);
      const liquidationRatio = toRay(1.5);
      const currentDebt = toWad(14000); // Over max
      
      const maxDai = calculateMaxDai(collateral, price, liquidationRatio, currentDebt);
      expect(maxDai).toBe(0n);
    });
  });

  describe('sDAI calculations', () => {
    it('should convert sDAI to DAI', () => {
      const sdai = toWad(100);
      const exchangeRate = toRay(1.05); // 1 sDAI = 1.05 DAI
      
      const dai = sdaiToDai(sdai, exchangeRate);
      expect(fromWad(dai)).toBeCloseTo(105, 0);
    });

    it('should convert DAI to sDAI', () => {
      const dai = toWad(105);
      const exchangeRate = toRay(1.05);
      
      const sdai = daiToSdai(dai, exchangeRate);
      expect(fromWad(sdai)).toBeCloseTo(100, 0);
    });
  });
});
