import {
  calculateActualDebt,
  calculateNormalizedDebt,
  isVaultAtRisk,
  getVaultRiskLevel,
  validateVaultOperation,
  calculateOptimalRatio,
  VaultData,
} from '../nodes/Maker/utils/vaultUtils';
import { toWad, toRay, RAY, WAD, RAD } from '../nodes/Maker/utils/mathUtils';

describe('Vault Utilities', () => {
  describe('calculateActualDebt', () => {
    it('should calculate actual debt from normalized debt and rate', () => {
      const normalizedDebt = toWad(1000); // 1000 normalized debt
      const rate = toRay(1.05); // 5% accumulated rate
      
      const actualDebt = calculateActualDebt(normalizedDebt, rate);
      expect(Number(actualDebt) / Number(WAD)).toBeCloseTo(1050, 0);
    });

    it('should handle rate of 1 (no accumulated fees)', () => {
      const normalizedDebt = toWad(1000);
      const rate = RAY; // Rate = 1
      
      const actualDebt = calculateActualDebt(normalizedDebt, rate);
      expect(Number(actualDebt) / Number(WAD)).toBeCloseTo(1000, 0);
    });
  });

  describe('calculateNormalizedDebt', () => {
    it('should calculate normalized debt from actual debt', () => {
      const actualDebt = toWad(1050);
      const rate = toRay(1.05);
      
      const normalizedDebt = calculateNormalizedDebt(actualDebt, rate);
      expect(Number(normalizedDebt) / Number(WAD)).toBeCloseTo(1000, 0);
    });
  });

  describe('isVaultAtRisk', () => {
    it('should return true for vault below warning threshold', () => {
      const collateral = toWad(10); // 10 ETH
      const debt = toWad(12000); // 12000 DAI
      const price = toRay(2000); // $2000/ETH
      const mat = toRay(1.5); // 150% liquidation ratio
      
      // Ratio = (10 * 2000) / 12000 = 166.67%
      // Warning threshold = 150% * 1.2 = 180%
      const atRisk = isVaultAtRisk(collateral, debt, price, mat);
      expect(atRisk).toBe(true);
    });

    it('should return false for safe vault', () => {
      const collateral = toWad(10);
      const debt = toWad(5000);
      const price = toRay(2000);
      const mat = toRay(1.5);
      
      // Ratio = (10 * 2000) / 5000 = 400%
      const atRisk = isVaultAtRisk(collateral, debt, price, mat);
      expect(atRisk).toBe(false);
    });

    it('should use custom warning threshold', () => {
      const collateral = toWad(10);
      const debt = toWad(8000);
      const price = toRay(2000);
      const mat = toRay(1.5);
      
      // Ratio = 250%, warning at 150% * 1.5 = 225%
      const atRisk = isVaultAtRisk(collateral, debt, price, mat, 1.5);
      expect(atRisk).toBe(false);
    });
  });

  describe('getVaultRiskLevel', () => {
    it('should return critical for ratio at/below liquidation', () => {
      const collateral = toWad(10);
      const debt = toWad(13500); // Ratio = 148%
      const price = toRay(2000);
      const mat = toRay(1.5);
      
      expect(getVaultRiskLevel(collateral, debt, price, mat)).toBe('critical');
    });

    it('should return high for ratio between 100-110% of liquidation', () => {
      const collateral = toWad(10);
      const debt = toWad(12500); // Ratio = 160%, liquidation at 150%
      const price = toRay(2000);
      const mat = toRay(1.5);
      
      expect(getVaultRiskLevel(collateral, debt, price, mat)).toBe('high');
    });

    it('should return moderate for ratio between 110-130% of liquidation', () => {
      const collateral = toWad(10);
      const debt = toWad(10500); // Ratio = 190%
      const price = toRay(2000);
      const mat = toRay(1.5);
      
      expect(getVaultRiskLevel(collateral, debt, price, mat)).toBe('moderate');
    });

    it('should return safe for ratio above 130% of liquidation', () => {
      const collateral = toWad(10);
      const debt = toWad(5000); // Ratio = 400%
      const price = toRay(2000);
      const mat = toRay(1.5);
      
      expect(getVaultRiskLevel(collateral, debt, price, mat)).toBe('safe');
    });
  });

  describe('validateVaultOperation', () => {
    const mockVault: VaultData = {
      id: 1,
      owner: '0x123',
      ilk: 'ETH-A',
      collateral: toWad(10),
      debt: toWad(5000) * RAY / WAD, // Normalized (will be multiplied by rate)
      rate: toRay(1.05),
      spot: toRay(1333), // Price with safety margin
      line: RAD * 100000000n, // 100M ceiling
      dust: RAD * 15000n / WAD, // 15000 dust
      mat: toRay(1.5),
    };

    it('should validate deposit operation', () => {
      const result = validateVaultOperation('deposit', toWad(1), mockVault, toRay(2000));
      expect(result.valid).toBe(true);
    });

    it('should reject zero deposit', () => {
      const result = validateVaultOperation('deposit', 0n, mockVault, toRay(2000));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('greater than 0');
    });

    it('should validate withdraw within limits', () => {
      const result = validateVaultOperation('withdraw', toWad(1), mockVault, toRay(2000));
      expect(result.valid).toBe(true);
    });

    it('should reject repay more than debt', () => {
      const result = validateVaultOperation('repay', toWad(100000), mockVault, toRay(2000));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cannot repay');
    });
  });

  describe('calculateOptimalRatio', () => {
    it('should calculate conservative ratio', () => {
      const ratio = calculateOptimalRatio(1.5, 'conservative');
      expect(ratio).toBe(3.75); // 150% * 2.5
    });

    it('should calculate moderate ratio', () => {
      const ratio = calculateOptimalRatio(1.5, 'moderate');
      expect(ratio).toBe(2.625); // 150% * 1.75
    });

    it('should calculate aggressive ratio', () => {
      const ratio = calculateOptimalRatio(1.5, 'aggressive');
      expect(ratio).toBe(1.95); // 150% * 1.3
    });
  });
});
