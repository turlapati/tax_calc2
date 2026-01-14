import { describe, it, expect, beforeAll } from "vitest";
import { solveForGrossIncome } from "@/services/taxCalculator";
import { taxDataService } from "@/services/taxDataService";
import type { TaxData, ScenarioInputs, FilingStatus } from "@/types/tax";

describe("Tax Calculator", () => {
  let taxData: TaxData;

  beforeAll(async () => {
    taxData = await taxDataService.getTaxData(2025);
  });

  const createScenario = (
    workState: string,
    residenceState: string,
    workCity: string = "N/A",
    benefits: Partial<ScenarioInputs> = {}
  ): ScenarioInputs => ({
    id: "test-scenario",
    workState,
    residenceState,
    workCity,
    healthInsurance: benefits.healthInsurance ?? 0,
    dentalVision: benefits.dentalVision ?? 0,
    hsa: benefits.hsa ?? 0,
    fsa: benefits.fsa ?? 0,
    retirement401k: benefits.retirement401k ?? 0,
    otherPretax: benefits.otherPretax ?? 0,
  });

  describe("Basic calculations", () => {
    it("calculates gross income for a simple scenario (TX - no state tax)", () => {
      const scenario = createScenario("TX", "TX");
      const result = solveForGrossIncome(100000, scenario, "single", taxData);

      expect(result.grossPretaxIncome).toBeGreaterThan(100000);
      expect(result.netIncome).toBeCloseTo(100000, 0);
      expect(result.stateTaxWork).toBe(0);
      expect(result.stateTaxResidence).toBe(0);
      expect(result.federalTax).toBeGreaterThan(0);
      expect(result.socialSecurityTax).toBeGreaterThan(0);
      expect(result.medicareTax).toBeGreaterThan(0);
    });

    it("calculates gross income for CA (high state tax)", () => {
      const scenario = createScenario("CA", "CA");
      const result = solveForGrossIncome(100000, scenario, "single", taxData);

      expect(result.grossPretaxIncome).toBeGreaterThan(100000);
      expect(result.netIncome).toBeCloseTo(100000, 0);
      expect(result.stateTaxWork).toBeGreaterThan(0);
      expect(result.sdiTax).toBeGreaterThan(0); // CA has SDI
    });

    it("calculates gross income for NYC (with city tax)", () => {
      const scenario = createScenario("NY", "NY", "NYC");
      const result = solveForGrossIncome(100000, scenario, "single", taxData);

      expect(result.grossPretaxIncome).toBeGreaterThan(100000);
      expect(result.netIncome).toBeCloseTo(100000, 0);
      expect(result.stateTaxWork).toBeGreaterThan(0);
      expect(result.cityTax).toBeGreaterThan(0);
    });

    it("TX requires less gross income than CA for same net", () => {
      const txScenario = createScenario("TX", "TX");
      const caScenario = createScenario("CA", "CA");

      const txResult = solveForGrossIncome(100000, txScenario, "single", taxData);
      const caResult = solveForGrossIncome(100000, caScenario, "single", taxData);

      expect(txResult.grossPretaxIncome).toBeLessThan(caResult.grossPretaxIncome);
    });
  });

  describe("Filing status variations", () => {
    const filingStatuses: FilingStatus[] = [
      "single",
      "marriedJointly",
      "marriedSeparately",
      "headOfHousehold",
    ];

    it.each(filingStatuses)("calculates for filing status: %s", (status) => {
      const scenario = createScenario("CA", "CA");
      const result = solveForGrossIncome(100000, scenario, status, taxData);

      expect(result.grossPretaxIncome).toBeGreaterThan(100000);
      expect(result.netIncome).toBeCloseTo(100000, 0);
    });

    it("married jointly has lower tax than single for same income", () => {
      const scenario = createScenario("CA", "CA");

      const singleResult = solveForGrossIncome(200000, scenario, "single", taxData);
      const marriedResult = solveForGrossIncome(200000, scenario, "marriedJointly", taxData);

      expect(marriedResult.totalTax).toBeLessThan(singleResult.totalTax);
    });
  });

  describe("Pre-tax benefits", () => {
    it("reduces taxable income when benefits are added", () => {
      const scenarioNoBenefits = createScenario("CA", "CA");
      const scenarioWithBenefits = createScenario("CA", "CA", "N/A", {
        healthInsurance: 6000,
        retirement401k: 20000,
      });

      const resultNoBenefits = solveForGrossIncome(100000, scenarioNoBenefits, "single", taxData);
      const resultWithBenefits = solveForGrossIncome(100000, scenarioWithBenefits, "single", taxData);

      // With pre-tax benefits, benefits are deducted correctly
      expect(resultWithBenefits.totalBenefitDeductions).toBe(26000);
      // Gross income with benefits should be higher to achieve same net
      expect(resultWithBenefits.grossPretaxIncome).toBeGreaterThan(resultNoBenefits.grossPretaxIncome);
    });

    it("correctly sums all benefit deductions", () => {
      const scenario = createScenario("TX", "TX", "N/A", {
        healthInsurance: 1000,
        dentalVision: 500,
        hsa: 2000,
        fsa: 1500,
        retirement401k: 5000,
        otherPretax: 1000,
      });

      const result = solveForGrossIncome(100000, scenario, "single", taxData);
      expect(result.totalBenefitDeductions).toBe(11000);
    });
  });

  describe("Cross-state scenarios", () => {
    it("handles work in one state, live in another", () => {
      const scenario = createScenario("NY", "NJ");
      const result = solveForGrossIncome(100000, scenario, "single", taxData);

      expect(result.grossPretaxIncome).toBeGreaterThan(100000);
      expect(result.workState).toBe("NY");
      expect(result.residenceState).toBe("NJ");
      expect(result.stateTaxWork).toBeGreaterThan(0);
      // Residence state tax may apply depending on reciprocity
    });

    it("handles DC work with VA residence", () => {
      const scenario = createScenario("DC", "VA");
      const result = solveForGrossIncome(100000, scenario, "single", taxData);

      expect(result.grossPretaxIncome).toBeGreaterThan(100000);
      expect(result.netIncome).toBeCloseTo(100000, 0);
    });
  });

  describe("Edge cases", () => {
    it("handles very low target income", () => {
      const scenario = createScenario("TX", "TX");
      const result = solveForGrossIncome(10000, scenario, "single", taxData);

      expect(result.grossPretaxIncome).toBeGreaterThan(10000);
      expect(result.netIncome).toBeCloseTo(10000, 0);
    });

    it("handles high target income", () => {
      const scenario = createScenario("CA", "CA");
      const result = solveForGrossIncome(500000, scenario, "single", taxData);

      expect(result.grossPretaxIncome).toBeGreaterThan(500000);
      expect(result.netIncome).toBeCloseTo(500000, 0);
      // Should hit higher tax brackets
      expect(result.federalTax).toBeGreaterThan(100000);
    });

    it("converges within tolerance", () => {
      const scenario = createScenario("CA", "CA");
      const targetNet = 150000;
      const result = solveForGrossIncome(targetNet, scenario, "single", taxData);

      const difference = Math.abs(result.netIncome - targetNet);
      expect(difference).toBeLessThan(1); // Within $1 tolerance
    });
  });

  describe("Result structure", () => {
    it("returns all required fields", () => {
      const scenario = createScenario("CA", "CA", "N/A");
      const result = solveForGrossIncome(100000, scenario, "single", taxData);

      expect(result).toHaveProperty("scenarioId");
      expect(result).toHaveProperty("grossPretaxIncome");
      expect(result).toHaveProperty("federalTax");
      expect(result).toHaveProperty("stateTaxWork");
      expect(result).toHaveProperty("stateTaxResidence");
      expect(result).toHaveProperty("cityTax");
      expect(result).toHaveProperty("socialSecurityTax");
      expect(result).toHaveProperty("medicareTax");
      expect(result).toHaveProperty("sdiTax");
      expect(result).toHaveProperty("totalBenefitDeductions");
      expect(result).toHaveProperty("totalTax");
      expect(result).toHaveProperty("netIncome");
      expect(result).toHaveProperty("workState");
      expect(result).toHaveProperty("residenceState");
      expect(result).toHaveProperty("workCity");
      expect(result).toHaveProperty("postTaxTarget");
    });

    it("total tax equals sum of individual taxes", () => {
      const scenario = createScenario("NY", "NY", "NYC");
      const result = solveForGrossIncome(100000, scenario, "single", taxData);

      const calculatedTotal =
        result.federalTax +
        result.stateTaxWork +
        result.stateTaxResidence +
        result.cityTax +
        result.socialSecurityTax +
        result.medicareTax +
        result.sdiTax;

      // Allow for small floating point differences
      expect(result.totalTax).toBeCloseTo(calculatedTotal, 1);
    });

    it("gross - total tax - benefits = net income", () => {
      const scenario = createScenario("CA", "CA", "N/A", {
        healthInsurance: 5000,
        retirement401k: 10000,
      });
      const result = solveForGrossIncome(100000, scenario, "single", taxData);

      const calculatedNet =
        result.grossPretaxIncome - result.totalTax - result.totalBenefitDeductions;

      expect(result.netIncome).toBeCloseTo(calculatedNet, 2);
    });
  });
});
