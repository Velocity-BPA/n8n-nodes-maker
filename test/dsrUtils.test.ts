import {
  calculateCurrentChi,
  pieToDai,
  daiToPie,
  calculateDsrApy,
  projectDsrEarnings,
  calculateSdaiExchangeRate,
  sdaiToDaiValue,
  daiToSdaiShares,
} from '../nodes/Maker/utils/dsrUtils';
import { toWad, toRay, RAY, WAD } from '../nodes/Maker/utils/mathUtils';

describe('DSR Utilities', () => {
  describe('calculateCurrentChi', () => {
    it('should return same chi if no time elapsed', () => {
      const chi = toRay(1.05);
      const dsr = toRay(1.000000001547125957); // ~5% APY
      const rho = BigInt(Math.floor(Date.now() / 1000));
      const now = rho;
      
      const result = calculateCurrentChi(chi, dsr, rho, now);
      expect(result).toBe(chi);
    });

    it('should increase chi over time', () => {
      const chi = RAY; // Start at 1
      const dsr = 1000000001547125957863212448n; // ~5% APY
      const rho = BigInt(Math.floor(Date.now() / 1000) - 86400); // 1 day ago
      const now = BigInt(Math.floor(Date.now() / 1000));
      
      const result = calculateCurrentChi(chi, dsr, rho, now);
      expect(result).toBeGreaterThan(chi);
    });
  });

  describe('pieToDai', () => {
    it('should convert pie to DAI using chi', () => {
      const pie = toWad(1000); // 1000 normalized DAI
      const chi = toRay(1.05); // 5% accumulated
      
      const dai = pieToDai(pie, chi);
      expect(Number(dai) / Number(WAD)).toBeCloseTo(1050, 0);
    });

    it('should return same amount when chi is 1', () => {
      const pie = toWad(1000);
      const chi = RAY;
      
      const dai = pieToDai(pie, chi);
      expect(Number(dai) / Number(WAD)).toBeCloseTo(1000, 0);
    });
  });

  describe('daiToPie', () => {
    it('should convert DAI to pie using chi', () => {
      const dai = toWad(1050);
      const chi = toRay(1.05);
      
      const pie = daiToPie(dai, chi);
      expect(Number(pie) / Number(WAD)).toBeCloseTo(1000, 0);
    });
  });

  describe('calculateDsrApy', () => {
    it('should calculate APY from per-second rate', () => {
      // Standard DSR rate for ~5% APY
      const dsr = 1000000001547125957863212448n;
      
      const apy = calculateDsrApy(dsr);
      expect(apy).toBeCloseTo(5, 0);
    });

    it('should return 0 for rate of 1', () => {
      const dsr = RAY;
      
      const apy = calculateDsrApy(dsr);
      expect(apy).toBeCloseTo(0, 1);
    });
  });

  describe('projectDsrEarnings', () => {
    it('should project future DSR earnings', () => {
      const deposit = toWad(10000); // 10000 DAI
      const dsr = 1000000001547125957863212448n; // ~5% APY
      const days = 365;
      
      const result = projectDsrEarnings(deposit, dsr, days);
      
      expect(result.apy).toBeCloseTo(5, 0);
      expect(Number(result.futureValue) / Number(WAD)).toBeGreaterThan(10000);
      expect(Number(result.earnings) / Number(WAD)).toBeCloseTo(500, -2); // ~$500
    });

    it('should return zero earnings for 0 days', () => {
      const deposit = toWad(10000);
      const dsr = 1000000001547125957863212448n;
      const days = 0;
      
      const result = projectDsrEarnings(deposit, dsr, days);
      
      expect(Number(result.earnings)).toBe(0);
    });
  });

  describe('sDAI exchange rate', () => {
    it('should calculate exchange rate', () => {
      const totalAssets = toWad(105000); // 105000 DAI
      const totalShares = toWad(100000); // 100000 sDAI
      
      const rate = calculateSdaiExchangeRate(totalAssets, totalShares);
      expect(rate).toBeCloseTo(1.05, 2);
    });

    it('should return 1 for zero supply', () => {
      const totalAssets = 0n;
      const totalShares = 0n;
      
      const rate = calculateSdaiExchangeRate(totalAssets, totalShares);
      expect(rate).toBe(1);
    });
  });

  describe('sDAI conversions', () => {
    it('should convert sDAI to DAI value', () => {
      const sdaiAmount = toWad(100);
      const exchangeRate = 1.05;
      
      const daiValue = sdaiToDaiValue(sdaiAmount, exchangeRate);
      expect(Number(daiValue) / Number(WAD)).toBeCloseTo(105, 0);
    });

    it('should convert DAI to sDAI shares', () => {
      const daiAmount = toWad(105);
      const exchangeRate = 1.05;
      
      const sdaiShares = daiToSdaiShares(daiAmount, exchangeRate);
      expect(Number(sdaiShares) / Number(WAD)).toBeCloseTo(100, 0);
    });
  });
});
