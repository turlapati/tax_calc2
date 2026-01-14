import { describe, it, expect } from "vitest";
import { encodeStateToUrl, decodeStateFromUrl } from "@/hooks/useUrlState";
import type { ScenarioInputs, FilingStatus } from "@/types/tax";

describe("URL State Encoding/Decoding", () => {
  const createScenario = (
    workState: string,
    residenceState: string
  ): ScenarioInputs => ({
    id: "test-id",
    workState,
    residenceState,
    workCity: "N/A",
    healthInsurance: 0,
    dentalVision: 0,
    hsa: 0,
    fsa: 0,
    retirement401k: 0,
    otherPretax: 0,
  });

  describe("encodeStateToUrl", () => {
    it("encodes state to base64 string", () => {
      const scenarios = [createScenario("CA", "CA")];
      const encoded = encodeStateToUrl(100000, "single", scenarios);

      expect(typeof encoded).toBe("string");
      expect(encoded.length).toBeGreaterThan(0);
    });

    it("encodes multiple scenarios", () => {
      const scenarios = [
        createScenario("CA", "CA"),
        createScenario("TX", "TX"),
        createScenario("NY", "NY"),
      ];
      const encoded = encodeStateToUrl(200000, "marriedJointly", scenarios);

      expect(typeof encoded).toBe("string");
    });

    it("encodes scenarios with benefits", () => {
      const scenario: ScenarioInputs = {
        id: "test",
        workState: "CA",
        residenceState: "CA",
        workCity: "N/A",
        healthInsurance: 6000,
        dentalVision: 500,
        hsa: 3850,
        fsa: 2850,
        retirement401k: 23000,
        otherPretax: 1000,
      };
      const encoded = encodeStateToUrl(150000, "single", [scenario]);

      expect(typeof encoded).toBe("string");
    });
  });

  describe("decodeStateFromUrl", () => {
    it("decodes encoded state correctly", () => {
      const scenarios = [createScenario("CA", "CA")];
      const encoded = encodeStateToUrl(100000, "single", scenarios);
      const decoded = decodeStateFromUrl(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded?.desiredIncome).toBe(100000);
      expect(decoded?.filingStatus).toBe("single");
      expect(decoded?.scenarios).toHaveLength(1);
      expect(decoded?.scenarios[0].workState).toBe("CA");
      expect(decoded?.scenarios[0].residenceState).toBe("CA");
    });

    it("preserves all filing statuses", () => {
      const filingStatuses: FilingStatus[] = [
        "single",
        "marriedJointly",
        "marriedSeparately",
        "headOfHousehold",
      ];

      filingStatuses.forEach((status) => {
        const encoded = encodeStateToUrl(100000, status, [createScenario("TX", "TX")]);
        const decoded = decodeStateFromUrl(encoded);
        expect(decoded?.filingStatus).toBe(status);
      });
    });

    it("preserves benefit values", () => {
      const scenario: ScenarioInputs = {
        id: "test",
        workState: "NY",
        residenceState: "NJ",
        workCity: "NYC",
        healthInsurance: 6000,
        dentalVision: 500,
        hsa: 3850,
        fsa: 2850,
        retirement401k: 23000,
        otherPretax: 1000,
      };
      const encoded = encodeStateToUrl(250000, "marriedJointly", [scenario]);
      const decoded = decodeStateFromUrl(encoded);

      expect(decoded?.scenarios[0].healthInsurance).toBe(6000);
      expect(decoded?.scenarios[0].dentalVision).toBe(500);
      expect(decoded?.scenarios[0].hsa).toBe(3850);
      expect(decoded?.scenarios[0].fsa).toBe(2850);
      expect(decoded?.scenarios[0].retirement401k).toBe(23000);
      expect(decoded?.scenarios[0].otherPretax).toBe(1000);
      expect(decoded?.scenarios[0].workCity).toBe("NYC");
    });

    it("returns null for invalid base64", () => {
      const decoded = decodeStateFromUrl("not-valid-base64!!!");
      expect(decoded).toBeNull();
    });

    it("returns null for invalid JSON structure", () => {
      const invalidJson = btoa("not json");
      const decoded = decodeStateFromUrl(invalidJson);
      expect(decoded).toBeNull();
    });

    it("returns null for missing required fields", () => {
      const incompleteState = btoa(JSON.stringify({ desiredIncome: 100000 }));
      const decoded = decodeStateFromUrl(incompleteState);
      expect(decoded).toBeNull();
    });
  });

  describe("Round-trip encoding/decoding", () => {
    it("preserves data through encode/decode cycle", () => {
      const originalScenarios = [
        createScenario("CA", "CA"),
        createScenario("TX", "TX"),
        createScenario("NY", "NY"),
        createScenario("WA", "WA"),
      ];
      const originalIncome = 175000;
      const originalStatus: FilingStatus = "headOfHousehold";

      const encoded = encodeStateToUrl(originalIncome, originalStatus, originalScenarios);
      const decoded = decodeStateFromUrl(encoded);

      expect(decoded?.desiredIncome).toBe(originalIncome);
      expect(decoded?.filingStatus).toBe(originalStatus);
      expect(decoded?.scenarios).toHaveLength(4);
      expect(decoded?.scenarios[0].workState).toBe("CA");
      expect(decoded?.scenarios[1].workState).toBe("TX");
      expect(decoded?.scenarios[2].workState).toBe("NY");
      expect(decoded?.scenarios[3].workState).toBe("WA");
    });
  });
});
