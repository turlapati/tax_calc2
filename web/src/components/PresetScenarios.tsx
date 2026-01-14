import { memo } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ScenarioInputs } from "@/types/tax";

interface PresetScenario {
  name: string;
  description: string;
  scenarios: Array<Omit<ScenarioInputs, "id">>;
}

const PRESET_SCENARIOS: PresetScenario[] = [
  {
    name: "Remote Worker Comparison",
    description: "Compare TX, FL, WA (no state tax) vs CA, NY",
    scenarios: [
      { workState: "TX", residenceState: "TX", workCity: "N/A", healthInsurance: 0, dentalVision: 0, hsa: 0, fsa: 0, retirement401k: 0, otherPretax: 0 },
      { workState: "FL", residenceState: "FL", workCity: "N/A", healthInsurance: 0, dentalVision: 0, hsa: 0, fsa: 0, retirement401k: 0, otherPretax: 0 },
      { workState: "WA", residenceState: "WA", workCity: "N/A", healthInsurance: 0, dentalVision: 0, hsa: 0, fsa: 0, retirement401k: 0, otherPretax: 0 },
      { workState: "CA", residenceState: "CA", workCity: "N/A", healthInsurance: 0, dentalVision: 0, hsa: 0, fsa: 0, retirement401k: 0, otherPretax: 0 },
    ],
  },
  {
    name: "NYC vs Other Cities",
    description: "NYC (with city tax) vs NJ, CT, PA",
    scenarios: [
      { workState: "NY", residenceState: "NY", workCity: "NYC", healthInsurance: 0, dentalVision: 0, hsa: 0, fsa: 0, retirement401k: 0, otherPretax: 0 },
      { workState: "NJ", residenceState: "NJ", workCity: "N/A", healthInsurance: 0, dentalVision: 0, hsa: 0, fsa: 0, retirement401k: 0, otherPretax: 0 },
      { workState: "CT", residenceState: "CT", workCity: "N/A", healthInsurance: 0, dentalVision: 0, hsa: 0, fsa: 0, retirement401k: 0, otherPretax: 0 },
      { workState: "PA", residenceState: "PA", workCity: "N/A", healthInsurance: 0, dentalVision: 0, hsa: 0, fsa: 0, retirement401k: 0, otherPretax: 0 },
    ],
  },
  {
    name: "Tech Hub Comparison",
    description: "CA, WA, TX, CO - popular tech locations",
    scenarios: [
      { workState: "CA", residenceState: "CA", workCity: "N/A", healthInsurance: 0, dentalVision: 0, hsa: 0, fsa: 0, retirement401k: 0, otherPretax: 0 },
      { workState: "WA", residenceState: "WA", workCity: "N/A", healthInsurance: 0, dentalVision: 0, hsa: 0, fsa: 0, retirement401k: 0, otherPretax: 0 },
      { workState: "TX", residenceState: "TX", workCity: "N/A", healthInsurance: 0, dentalVision: 0, hsa: 0, fsa: 0, retirement401k: 0, otherPretax: 0 },
      { workState: "CO", residenceState: "CO", workCity: "N/A", healthInsurance: 0, dentalVision: 0, hsa: 0, fsa: 0, retirement401k: 0, otherPretax: 0 },
    ],
  },
  {
    name: "With Benefits Package",
    description: "Single scenario with typical benefits",
    scenarios: [
      { workState: "CA", residenceState: "CA", workCity: "N/A", healthInsurance: 6000, dentalVision: 600, hsa: 3850, fsa: 0, retirement401k: 23000, otherPretax: 0 },
    ],
  },
  {
    name: "Cross-State Commute",
    description: "Work in one state, live in another",
    scenarios: [
      { workState: "NY", residenceState: "NJ", workCity: "NYC", healthInsurance: 0, dentalVision: 0, hsa: 0, fsa: 0, retirement401k: 0, otherPretax: 0 },
      { workState: "NY", residenceState: "CT", workCity: "NYC", healthInsurance: 0, dentalVision: 0, hsa: 0, fsa: 0, retirement401k: 0, otherPretax: 0 },
      { workState: "DC", residenceState: "VA", workCity: "N/A", healthInsurance: 0, dentalVision: 0, hsa: 0, fsa: 0, retirement401k: 0, otherPretax: 0 },
      { workState: "DC", residenceState: "MD", workCity: "N/A", healthInsurance: 0, dentalVision: 0, hsa: 0, fsa: 0, retirement401k: 0, otherPretax: 0 },
    ],
  },
];

interface PresetScenariosProps {
  onApplyPreset: (scenarios: Array<Omit<ScenarioInputs, "id">>) => void;
}

export const PresetScenarios = memo(function PresetScenarios({ onApplyPreset }: PresetScenariosProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mr-1">
        <Sparkles className="h-4 w-4" />
        Quick Start:
      </span>
      {PRESET_SCENARIOS.map((preset) => (
        <Button
          key={preset.name}
          variant="outline"
          size="sm"
          onClick={() => onApplyPreset(preset.scenarios)}
          title={preset.description}
          className="text-xs h-7 px-2"
        >
          {preset.name}
        </Button>
      ))}
    </div>
  );
});
