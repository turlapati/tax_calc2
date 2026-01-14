import { describe, it, expect } from "vitest";
import { taxDataService } from "@/services/taxDataService";

describe("Tax Data Service", () => {
  describe("getTaxData", () => {
    it("loads tax data for 2025", async () => {
      const data = await taxDataService.getTaxData(2025);

      expect(data).toBeDefined();
      expect(data.federal).toBeDefined();
      expect(data.state).toBeDefined();
      expect(data.city).toBeDefined();
      expect(data.fica).toBeDefined();
      expect(data.sdi).toBeDefined();
    });

    it("contains federal tax brackets for all filing statuses", async () => {
      const data = await taxDataService.getTaxData(2025);

      expect(data.federal.single).toBeDefined();
      expect(data.federal.marriedJointly).toBeDefined();
      expect(data.federal.marriedSeparately).toBeDefined();
      expect(data.federal.headOfHousehold).toBeDefined();

      // Each should have multiple brackets
      expect(data.federal.single.length).toBeGreaterThan(0);
      expect(data.federal.marriedJointly.length).toBeGreaterThan(0);
    });

    it("contains state tax data for multiple states", async () => {
      const data = await taxDataService.getTaxData(2025);
      const states = Object.keys(data.state);

      expect(states.length).toBeGreaterThan(40); // Should have most US states
      expect(states).toContain("CA");
      expect(states).toContain("NY");
      expect(states).toContain("TX");
      expect(states).toContain("FL");
      expect(states).toContain("WA");
    });

    it("TX and FL have zero state tax", async () => {
      const data = await taxDataService.getTaxData(2025);

      // No-income-tax states should have 0% rate or empty brackets
      const txBrackets = data.state.TX || [];
      const flBrackets = data.state.FL || [];

      // These states should have either no brackets or all-zero rates
      const txHasTax = txBrackets.some((b) => b.rate > 0);
      const flHasTax = flBrackets.some((b) => b.rate > 0);

      expect(txHasTax).toBe(false);
      expect(flHasTax).toBe(false);
    });

    it("CA has state tax brackets", async () => {
      const data = await taxDataService.getTaxData(2025);

      expect(data.state.CA).toBeDefined();
      expect(data.state.CA.length).toBeGreaterThan(0);

      // CA should have non-zero tax rates
      const hasNonZeroRate = data.state.CA.some((b) => b.rate > 0);
      expect(hasNonZeroRate).toBe(true);
    });

    it("contains city tax data for NYC", async () => {
      const data = await taxDataService.getTaxData(2025);

      expect(data.city.NY).toBeDefined();
      expect(data.city.NY.NYC).toBeDefined();
      expect(data.city.NY.NYC.length).toBeGreaterThan(0);
    });

    it("contains FICA rates", async () => {
      const data = await taxDataService.getTaxData(2025);

      expect(data.fica.socialSecurityRate).toBeDefined();
      expect(data.fica.socialSecurityLimit).toBeDefined();
      expect(data.fica.medicareRate).toBeDefined();
      expect(data.fica.medicareAdditionalRate).toBeDefined();
      expect(data.fica.medicareAdditionalThresholds).toBeDefined();
    });

    it("contains SDI rates for CA", async () => {
      const data = await taxDataService.getTaxData(2025);

      expect(data.sdi.CA).toBeDefined();
      expect(data.sdi.CA.rate).toBeDefined();
    });

    it("federal brackets have correct structure", async () => {
      const data = await taxDataService.getTaxData(2025);
      const singleBrackets = data.federal.single;

      singleBrackets.forEach((bracket) => {
        expect(bracket).toHaveProperty("maxIncome");
        expect(bracket).toHaveProperty("rate");
      });
    });

    it("federal brackets are in ascending order by maxIncome", async () => {
      const data = await taxDataService.getTaxData(2025);
      const singleBrackets = data.federal.single;

      // Filter out the last bracket which may have -1 or Infinity for maxIncome
      const finiteBrackets = singleBrackets.filter((b) => b.maxIncome > 0);

      for (let i = 1; i < finiteBrackets.length; i++) {
        const prevMax = finiteBrackets[i - 1].maxIncome;
        const currMax = finiteBrackets[i].maxIncome;
        expect(currMax).toBeGreaterThanOrEqual(prevMax);
      }
    });
  });

  describe("Helper functions via getTaxData", () => {
    it("can extract list of state codes", async () => {
      const data = await taxDataService.getTaxData(2025);
      const states = Object.keys(data.state).sort();

      expect(Array.isArray(states)).toBe(true);
      expect(states.length).toBeGreaterThan(0);
      expect(states).toContain("CA");
      expect(states).toContain("NY");
      expect(states).toContain("TX");
    });

    it("can extract cities for a state", async () => {
      const data = await taxDataService.getTaxData(2025);
      const nyCities = Object.keys(data.city.NY || {});

      expect(Array.isArray(nyCities)).toBe(true);
      expect(nyCities).toContain("NYC");
    });

    it("returns empty for states without city taxes", async () => {
      const data = await taxDataService.getTaxData(2025);
      const txCities = Object.keys(data.city.TX || {});

      expect(Array.isArray(txCities)).toBe(true);
      expect(txCities.length).toBe(0);
    });
  });
});
