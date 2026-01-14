import { memo } from "react";
import { Trash2, Copy } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, type SelectOption } from "@/components/ui/Select";
import { formatNumberWithCommas, parseNumericInput } from "@/lib/utils";
import type { ScenarioInputs, TaxData } from "@/types/tax";

interface ScenarioCardProps {
  scenario: ScenarioInputs;
  index: number;
  taxData: TaxData;
  canRemove: boolean;
  canDuplicate: boolean;
  onUpdate: (id: string, updates: Partial<ScenarioInputs>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export const ScenarioCard = memo(function ScenarioCard({
  scenario,
  index,
  taxData,
  canRemove,
  canDuplicate,
  onUpdate,
  onRemove,
  onDuplicate,
}: ScenarioCardProps) {
  const states = Object.keys(taxData.state).sort();
  const stateOptions: SelectOption[] = states.map((s) => ({ value: s, label: s }));

  const citiesForState = taxData.city[scenario.workState] || {};
  const cityOptions: SelectOption[] = [
    { value: "N/A", label: "N/A" },
    ...Object.keys(citiesForState).map((c) => ({ value: c, label: c })),
  ];

  const hasSDI = scenario.workState in taxData.sdi;
  const hasCities = Object.keys(citiesForState).length > 0;

  const handleNumericChange = (field: keyof ScenarioInputs, value: string) => {
    const numValue = parseNumericInput(value);
    onUpdate(scenario.id, { [field]: numValue });
  };

  const formatValue = (value: number) => {
    return value > 0 ? formatNumberWithCommas(value) : "";
  };

  return (
    <Card className="min-w-[340px] max-w-[380px] flex-shrink-0 hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-gradient-from to-gradient-to text-white text-sm font-bold">
              {index + 1}
            </span>
            <CardTitle className="text-base text-slate-900 dark:text-slate-100">Scenario {index + 1}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {canDuplicate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20"
                onClick={() => onDuplicate(scenario.id)}
                title="Duplicate scenario"
                aria-label="Duplicate scenario"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
            {canRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => onRemove(scenario.id)}
                title="Remove scenario"
                aria-label="Remove scenario"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Work State"
            options={stateOptions}
            value={scenario.workState}
            placeholder="Select..."
            onChange={(e) =>
              onUpdate(scenario.id, {
                workState: e.target.value,
                workCity: "N/A",
              })
            }
          />
          <Select
            label="Living State"
            options={stateOptions}
            value={scenario.residenceState}
            placeholder="Select..."
            onChange={(e) =>
              onUpdate(scenario.id, { residenceState: e.target.value })
            }
          />
        </div>

        {hasCities && (
          <Select
            label="Work City"
            options={cityOptions}
            value={scenario.workCity}
            onChange={(e) =>
              onUpdate(scenario.id, { workCity: e.target.value })
            }
          />
        )}

        {hasSDI && (
          <div className="text-sm text-slate-600 dark:text-slate-400 bg-sky-50 dark:bg-sky-900/30 rounded-md px-3 py-2">
            SDI/PFML applies in {scenario.workState}
          </div>
        )}

        <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Pre-tax Benefit Deductions (Annual)</p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Health Ins"
              prefix="$"
              type="text"
              inputMode="decimal"
              value={formatValue(scenario.healthInsurance)}
              placeholder="0"
              onChange={(e) =>
                handleNumericChange("healthInsurance", e.target.value)
              }
            />
            <Input
              label="Dental/Vision"
              prefix="$"
              type="text"
              inputMode="decimal"
              value={formatValue(scenario.dentalVision)}
              placeholder="0"
              onChange={(e) =>
                handleNumericChange("dentalVision", e.target.value)
              }
            />
            <Input
              label="HSA"
              prefix="$"
              type="text"
              inputMode="decimal"
              value={formatValue(scenario.hsa)}
              placeholder="0"
              onChange={(e) => handleNumericChange("hsa", e.target.value)}
            />
            <Input
              label="FSA"
              prefix="$"
              type="text"
              inputMode="decimal"
              value={formatValue(scenario.fsa)}
              placeholder="0"
              onChange={(e) => handleNumericChange("fsa", e.target.value)}
            />
            <Input
              label="401k/403b"
              prefix="$"
              type="text"
              inputMode="decimal"
              value={formatValue(scenario.retirement401k)}
              placeholder="0"
              onChange={(e) =>
                handleNumericChange("retirement401k", e.target.value)
              }
            />
            <Input
              label="Other PreTax"
              prefix="$"
              type="text"
              inputMode="decimal"
              value={formatValue(scenario.otherPretax)}
              placeholder="0"
              onChange={(e) =>
                handleNumericChange("otherPretax", e.target.value)
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
