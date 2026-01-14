import { useEffect, useCallback, useRef, useState, lazy, Suspense } from "react";
import { PlusCircle, Calculator, Loader2, DollarSign, Share2, Check } from "lucide-react";
import { formatNumberWithCommas, parseNumericInput } from "@/lib/utils";
import { useTaxCalculator } from "@/hooks/useTaxCalculator";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ScenarioCard } from "@/components/ScenarioCard";
import { ResultCard } from "@/components/ResultCard";
const ComparisonChart = lazy(() => import("@/components/ComparisonChart").then(m => ({ default: m.ComparisonChart })));
const TaxPieChart = lazy(() => import("@/components/TaxPieChart").then(m => ({ default: m.TaxPieChart })));
const ExportResults = lazy(() => import("@/components/ExportResults").then(m => ({ default: m.ExportResults })));
import { PresetScenarios } from "@/components/PresetScenarios";
import type { FilingStatus } from "@/types/tax";

const FILING_STATUS_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "marriedJointly", label: "Married Filing Jointly" },
  { value: "marriedSeparately", label: "Married Filing Separately" },
  { value: "headOfHousehold", label: "Head of Household" },
];

function App() {
  const {
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
    copyShareableUrl,
    applyPreset,
  } = useTaxCalculator();

  const resultsRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const success = await copyShareableUrl();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter to calculate
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        calculateAll();
      }
      // Ctrl+N or Cmd+N to add scenario
      if ((e.ctrlKey || e.metaKey) && e.key === "n" && canAddScenario) {
        e.preventDefault();
        addScenario();
      }
    },
    [calculateAll, addScenario, canAddScenario]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading tax data...</span>
      </div>
    );
  }

  if (!taxData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-lg">Failed to load tax data</p>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-gradient-from to-gradient-to rounded-xl shadow-lg">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  Post-Tax Income Calculator
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  2025 Tax Year Estimates
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    Share
                  </>
                )}
              </Button>
              <ThemeToggle />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4 max-w-2xl">
            Calculate the gross pre-tax income needed to achieve your desired post-tax income across different states and scenarios.
          </p>
        </header>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive whitespace-pre-line">{error}</p>
            <button
              className="text-xs text-destructive underline mt-1"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                label="Desired Annual Post-Tax Income"
                prefix="$"
                type="text"
                inputMode="decimal"
                value={desiredIncome > 0 ? formatNumberWithCommas(desiredIncome) : ""}
                onChange={(e) => {
                  const val = parseNumericInput(e.target.value);
                  setDesiredIncome(val);
                }}
              />
              <Select
                label="Filing Status"
                options={FILING_STATUS_OPTIONS}
                value={filingStatus}
                onChange={(e) => setFilingStatus(e.target.value as FilingStatus)}
              />
            </div>
            <PresetScenarios onApplyPreset={applyPreset} />
          </CardContent>
        </Card>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-1 w-8 bg-gradient-to-r from-gradient-from to-gradient-to rounded-full"></div>
              <h2 className="text-xl font-bold">Scenarios</h2>
            </div>
            {canAddScenario && (
              <Button variant="outline" size="sm" onClick={addScenario}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Scenario
              </Button>
            )}
          </div>

          <div 
            ref={scenariosContainerRef}
            className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
          >
            {scenarios.map((scenario, index) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                index={index}
                taxData={taxData}
                canRemove={scenarios.length > 1}
                canDuplicate={scenarios.length < 4}
                onUpdate={updateScenario}
                onRemove={removeScenario}
                onDuplicate={duplicateScenario}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <Button
            size="lg"
            onClick={calculateAll}
            disabled={calculating}
            className="min-w-[200px]"
          >
            {calculating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                Calculate All Scenarios
              </>
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <section ref={resultsRef} className="pt-8" aria-labelledby="results-heading">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-1 w-8 bg-gradient-to-r from-success to-gradient-to rounded-full"></div>
              <h2 id="results-heading" className="text-xl font-bold">Results</h2>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4">
              {results.map((result, index) => (
                <ResultCard key={result.scenarioId} result={result} index={index} />
              ))}
            </div>

            <Suspense fallback={<div className="mt-6 p-4 text-center text-muted-foreground">Loading charts...</div>}>
              <Card className="mt-6 p-4">
                <ComparisonChart results={results} />
              </Card>

              <TaxPieChart results={results} />

              <ExportResults
                results={results}
                scenarios={scenarios}
                desiredIncome={desiredIncome}
                filingStatus={filingStatus}
              />
            </Suspense>

            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Disclaimer:</strong> Estimates based on simplified 2025 rules. Does not include
                all deductions/credits. Consult a tax professional for accurate advice.
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default App
