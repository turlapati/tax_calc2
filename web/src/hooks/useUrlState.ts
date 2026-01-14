import { useEffect, useCallback } from "react";
import { z } from "zod";
import type { FilingStatus, ScenarioInputs } from "@/types/tax";

const UrlScenarioSchema = z.object({
  workState: z.string(),
  residenceState: z.string(),
  workCity: z.string(),
  healthInsurance: z.number().min(0),
  dentalVision: z.number().min(0),
  hsa: z.number().min(0),
  fsa: z.number().min(0),
  retirement401k: z.number().min(0),
  otherPretax: z.number().min(0),
});

const UrlStateSchema = z.object({
  desiredIncome: z.number().positive(),
  filingStatus: z.enum(["single", "marriedJointly", "marriedSeparately", "headOfHousehold"]),
  scenarios: z.array(UrlScenarioSchema).min(1).max(4),
});

type UrlState = z.infer<typeof UrlStateSchema>;

export function encodeStateToUrl(
  desiredIncome: number,
  filingStatus: FilingStatus,
  scenarios: ScenarioInputs[]
): string {
  const state: UrlState = {
    desiredIncome,
    filingStatus,
    scenarios: scenarios.map((s) => ({
      workState: s.workState,
      residenceState: s.residenceState,
      workCity: s.workCity,
      healthInsurance: s.healthInsurance,
      dentalVision: s.dentalVision,
      hsa: s.hsa,
      fsa: s.fsa,
      retirement401k: s.retirement401k,
      otherPretax: s.otherPretax,
    })),
  };

  const encoded = btoa(JSON.stringify(state));
  return encoded;
}

export function decodeStateFromUrl(encoded: string): UrlState | null {
  try {
    const decoded = atob(encoded);
    const rawState: unknown = JSON.parse(decoded);
    
    const result = UrlStateSchema.safeParse(rawState);
    if (!result.success) {
      if (import.meta.env.DEV) {
        console.error("URL state validation failed:", result.error);
      }
      return null;
    }
    
    return result.data;
  } catch {
    return null;
  }
}

export function useUrlState(
  desiredIncome: number,
  filingStatus: FilingStatus,
  scenarios: ScenarioInputs[],
  setDesiredIncome: (value: number) => void,
  setFilingStatus: (value: FilingStatus) => void,
  loadScenarios: (scenarios: UrlState["scenarios"]) => void
) {
  // Load state from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stateParam = params.get("state");
    
    if (stateParam) {
      const state = decodeStateFromUrl(stateParam);
      if (state) {
        setDesiredIncome(state.desiredIncome);
        setFilingStatus(state.filingStatus);
        loadScenarios(state.scenarios);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - setters are stable from useState

  // Generate shareable URL
  const getShareableUrl = useCallback(() => {
    const encoded = encodeStateToUrl(desiredIncome, filingStatus, scenarios);
    const url = new URL(window.location.href);
    url.searchParams.set("state", encoded);
    return url.toString();
  }, [desiredIncome, filingStatus, scenarios]);

  // Copy URL to clipboard
  const copyShareableUrl = useCallback(async () => {
    const url = getShareableUrl();
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }, [getShareableUrl]);

  return {
    getShareableUrl,
    copyShareableUrl,
  };
}
