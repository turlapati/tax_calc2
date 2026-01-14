import { useState, useEffect, useCallback, useRef } from "react";
import type {
  TaxData,
  FilingStatus,
  ScenarioInputs,
  CalculationResult,
} from "@/types/tax";
import { taxDataService } from "@/services/taxDataService";
import { solveForGrossIncome } from "@/services/taxCalculator";
import { useUrlState } from "@/hooks/useUrlState";

const MAX_SCENARIOS = 4;

function createEmptyScenario(): ScenarioInputs {
  return {
    id: crypto.randomUUID(),
    workState: "",
    residenceState: "",
    workCity: "N/A",
    healthInsurance: 0,
    dentalVision: 0,
    hsa: 0,
    fsa: 0,
    retirement401k: 0,
    otherPretax: 0,
  };
}

function createScenarioFromPrevious(previous: ScenarioInputs): ScenarioInputs {
  return {
    id: crypto.randomUUID(),
    workState: "",
    residenceState: "",
    workCity: "N/A",
    healthInsurance: previous.healthInsurance,
    dentalVision: previous.dentalVision,
    hsa: previous.hsa,
    fsa: previous.fsa,
    retirement401k: previous.retirement401k,
    otherPretax: previous.otherPretax,
  };
}

export function useTaxCalculator() {
  const [taxData, setTaxData] = useState<TaxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [desiredIncome, setDesiredIncome] = useState(500000);
  const [filingStatus, setFilingStatus] = useState<FilingStatus>("single");
  const [scenarios, setScenarios] = useState<ScenarioInputs[]>([
    createEmptyScenario(),
  ]);
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    async function loadTaxData() {
      try {
        setLoading(true);
        const data = await taxDataService.getTaxData(2025);
        setTaxData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tax data");
      } finally {
        setLoading(false);
      }
    }
    loadTaxData();
  }, []);

  const scenariosContainerRef = useRef<HTMLDivElement | null>(null);

  const addScenario = useCallback(() => {
    if (scenarios.length < MAX_SCENARIOS) {
      setScenarios((prev) => {
        const lastScenario = prev[prev.length - 1];
        const newScenario = lastScenario
          ? createScenarioFromPrevious(lastScenario)
          : createEmptyScenario();
        return [...prev, newScenario];
      });
      
      // Scroll to the new scenario after it's added
      setTimeout(() => {
        if (scenariosContainerRef.current) {
          scenariosContainerRef.current.scrollTo({
            left: scenariosContainerRef.current.scrollWidth,
            behavior: "smooth",
          });
        }
      }, 50);
    }
  }, [scenarios.length]);

  const removeScenario = useCallback((id: string) => {
    setScenarios((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  const duplicateScenario = useCallback((id: string) => {
    if (scenarios.length >= MAX_SCENARIOS) return;
    
    setScenarios((prev) => {
      const scenarioToDuplicate = prev.find((s) => s.id === id);
      if (!scenarioToDuplicate) return prev;
      
      const duplicated: ScenarioInputs = {
        ...scenarioToDuplicate,
        id: crypto.randomUUID(),
      };
      return [...prev, duplicated];
    });

    // Scroll to the new scenario after it's added
    setTimeout(() => {
      if (scenariosContainerRef.current) {
        scenariosContainerRef.current.scrollTo({
          left: scenariosContainerRef.current.scrollWidth,
          behavior: "smooth",
        });
      }
    }, 50);
  }, [scenarios.length]);

  const updateScenario = useCallback(
    (id: string, updates: Partial<ScenarioInputs>) => {
      setScenarios((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
    },
    []
  );

  const calculateAll = useCallback(() => {
    if (!taxData) return;

    setCalculating(true);
    setResults([]);

    const newResults: CalculationResult[] = [];
    const errors: string[] = [];

    for (const scenario of scenarios) {
      if (!scenario.workState || !scenario.residenceState) {
        errors.push(
          `Scenario ${scenarios.indexOf(scenario) + 1}: Please select both Work State and Living State`
        );
        continue;
      }

      try {
        const result = solveForGrossIncome(
          desiredIncome,
          scenario,
          filingStatus,
          taxData
        );
        newResults.push(result);
      } catch (err) {
        errors.push(
          `Scenario ${scenarios.indexOf(scenario) + 1}: ${
            err instanceof Error ? err.message : "Calculation failed"
          }`
        );
      }
    }

    setResults(newResults);
    setCalculating(false);

    if (errors.length > 0) {
      setError(errors.join("\n"));
    } else {
      setError(null);
    }
  }, [taxData, scenarios, desiredIncome, filingStatus]);

  const canAddScenario = scenarios.length < MAX_SCENARIOS;

  // Load scenarios from URL state or presets
  const loadScenarios = useCallback(
    (urlScenarios: Array<Omit<ScenarioInputs, "id">>) => {
      const newScenarios = urlScenarios.slice(0, MAX_SCENARIOS).map((s) => ({
        ...s,
        id: crypto.randomUUID(),
      }));
      if (newScenarios.length > 0) {
        setScenarios(newScenarios);
      }
    },
    []
  );

  // Apply preset scenarios
  const applyPreset = useCallback(
    (presetScenarios: Array<Omit<ScenarioInputs, "id">>) => {
      loadScenarios(presetScenarios);
      setResults([]);
    },
    [loadScenarios]
  );

  // URL state management
  const { getShareableUrl, copyShareableUrl } = useUrlState(
    desiredIncome,
    filingStatus,
    scenarios,
    setDesiredIncome,
    setFilingStatus,
    loadScenarios
  );

  return {
    taxData,
    loading,
    error,
    setError,
    desiredIncome,
    setDesiredIncome,
    filingStatus,
    setFilingStatus,
    scenarios,
    addScenario,
    removeScenario,
    duplicateScenario,
    updateScenario,
    results,
    calculating,
    calculateAll,
    canAddScenario,
    scenariosContainerRef,
    getShareableUrl,
    copyShareableUrl,
    applyPreset,
  };
}
