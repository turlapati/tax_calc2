import { describe, it, expect } from "vitest";
import { TaxDataSchema } from "@/schemas/taxData";
import defaultTaxData2025 from "@/data/tax-data-2025.json";

describe("TaxData Zod Schema Validation", () => {
  describe("Valid data", () => {
    it("validates bundled 2025 tax data successfully", () => {
      const result = TaxDataSchema.safeParse(defaultTaxData2025);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.year).toBe(2025);
        expect(result.data.federal).toBeDefined();
        expect(result.data.state).toBeDefined();
      }
    });

    it("validates minimal valid tax data", () => {
      const minimalData = {
        year: 2025,
        version: "1.0",
        lastUpdated: "2025-01-01",
        federal: {
          single: [{ rate: 0.1, maxIncome: 10000 }],
          marriedJointly: [{ rate: 0.1, maxIncome: 20000 }],
          marriedSeparately: [{ rate: 0.1, maxIncome: 10000 }],
          headOfHousehold: [{ rate: 0.1, maxIncome: 15000 }],
        },
        state: {
          CA: [{ rate: 0.05, maxIncome: 50000 }],
        },
        city: {},
        fica: {
          socialSecurityRate: 0.062,
          socialSecurityLimit: 160000,
          medicareRate: 0.0145,
          medicareAdditionalRate: 0.009,
          medicareAdditionalThresholds: {
            single: 200000,
            marriedJointly: 250000,
            marriedSeparately: 125000,
            headOfHousehold: 200000,
          },
        },
        sdi: {},
      };

      const result = TaxDataSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });
  });

  describe("Invalid data", () => {
    it("rejects data missing required fields", () => {
      const invalidData = {
        year: 2025,
        version: "1.0",
      };

      const result = TaxDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("rejects data with wrong types", () => {
      const invalidData = {
        year: "2025", // should be number
        version: "1.0",
        lastUpdated: "2025-01-01",
        federal: {},
        state: {},
        city: {},
        fica: {},
        sdi: {},
      };

      const result = TaxDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("rejects federal brackets with missing rate", () => {
      const invalidData = {
        year: 2025,
        version: "1.0",
        lastUpdated: "2025-01-01",
        federal: {
          single: [{ maxIncome: 10000 }], // missing rate
          marriedJointly: [],
          marriedSeparately: [],
          headOfHousehold: [],
        },
        state: {},
        city: {},
        fica: {
          socialSecurityRate: 0.062,
          socialSecurityLimit: 160000,
          medicareRate: 0.0145,
          medicareAdditionalRate: 0.009,
          medicareAdditionalThresholds: {
            single: 200000,
            marriedJointly: 250000,
            marriedSeparately: 125000,
            headOfHousehold: 200000,
          },
        },
        sdi: {},
      };

      const result = TaxDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("rejects SDI with invalid structure", () => {
      const invalidData = {
        year: 2025,
        version: "1.0",
        lastUpdated: "2025-01-01",
        federal: {
          single: [],
          marriedJointly: [],
          marriedSeparately: [],
          headOfHousehold: [],
        },
        state: {},
        city: {},
        fica: {
          socialSecurityRate: 0.062,
          socialSecurityLimit: 160000,
          medicareRate: 0.0145,
          medicareAdditionalRate: 0.009,
          medicareAdditionalThresholds: {
            single: 200000,
            marriedJointly: 250000,
            marriedSeparately: 125000,
            headOfHousehold: 200000,
          },
        },
        sdi: {
          CA: { rate: "invalid" }, // should be number
        },
      };

      const result = TaxDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("rejects null instead of object", () => {
      const result = TaxDataSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("rejects undefined", () => {
      const result = TaxDataSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it("rejects empty object", () => {
      const result = TaxDataSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("accepts SDI with null values for optional fields", () => {
      const dataWithNullSDI = {
        year: 2025,
        version: "1.0",
        lastUpdated: "2025-01-01",
        federal: {
          single: [{ rate: 0.1, maxIncome: 10000 }],
          marriedJointly: [{ rate: 0.1, maxIncome: 20000 }],
          marriedSeparately: [{ rate: 0.1, maxIncome: 10000 }],
          headOfHousehold: [{ rate: 0.1, maxIncome: 15000 }],
        },
        state: {},
        city: {},
        fica: {
          socialSecurityRate: 0.062,
          socialSecurityLimit: 160000,
          medicareRate: 0.0145,
          medicareAdditionalRate: 0.009,
          medicareAdditionalThresholds: {
            single: 200000,
            marriedJointly: 250000,
            marriedSeparately: 125000,
            headOfHousehold: 200000,
          },
        },
        sdi: {
          CA: {
            rate: 0.009,
            maxWage: null,
            maxContribution: null,
            maxWeeklyDeduction: null,
          },
        },
      };

      const result = TaxDataSchema.safeParse(dataWithNullSDI);
      expect(result.success).toBe(true);
    });

    it("accepts negative maxIncome for unlimited bracket", () => {
      const dataWithUnlimitedBracket = {
        year: 2025,
        version: "1.0",
        lastUpdated: "2025-01-01",
        federal: {
          single: [
            { rate: 0.1, maxIncome: 10000 },
            { rate: 0.37, maxIncome: -1 }, // -1 indicates unlimited
          ],
          marriedJointly: [{ rate: 0.1, maxIncome: 20000 }],
          marriedSeparately: [{ rate: 0.1, maxIncome: 10000 }],
          headOfHousehold: [{ rate: 0.1, maxIncome: 15000 }],
        },
        state: {},
        city: {},
        fica: {
          socialSecurityRate: 0.062,
          socialSecurityLimit: 160000,
          medicareRate: 0.0145,
          medicareAdditionalRate: 0.009,
          medicareAdditionalThresholds: {
            single: 200000,
            marriedJointly: 250000,
            marriedSeparately: 125000,
            headOfHousehold: 200000,
          },
        },
        sdi: {},
      };

      const result = TaxDataSchema.safeParse(dataWithUnlimitedBracket);
      expect(result.success).toBe(true);
    });

    it("accepts nested city tax structure", () => {
      const dataWithCityTax = {
        year: 2025,
        version: "1.0",
        lastUpdated: "2025-01-01",
        federal: {
          single: [{ rate: 0.1, maxIncome: 10000 }],
          marriedJointly: [{ rate: 0.1, maxIncome: 20000 }],
          marriedSeparately: [{ rate: 0.1, maxIncome: 10000 }],
          headOfHousehold: [{ rate: 0.1, maxIncome: 15000 }],
        },
        state: {
          NY: [{ rate: 0.05, maxIncome: 50000 }],
        },
        city: {
          NY: {
            NYC: [{ rate: 0.03, maxIncome: 50000 }],
            Yonkers: [{ rate: 0.015, maxIncome: -1 }],
          },
        },
        fica: {
          socialSecurityRate: 0.062,
          socialSecurityLimit: 160000,
          medicareRate: 0.0145,
          medicareAdditionalRate: 0.009,
          medicareAdditionalThresholds: {
            single: 200000,
            marriedJointly: 250000,
            marriedSeparately: 125000,
            headOfHousehold: 200000,
          },
        },
        sdi: {},
      };

      const result = TaxDataSchema.safeParse(dataWithCityTax);
      expect(result.success).toBe(true);
    });
  });
});
