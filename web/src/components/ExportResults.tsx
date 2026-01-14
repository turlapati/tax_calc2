import { memo, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import type { CalculationResult, FilingStatus, ScenarioInputs } from "@/types/tax";
import { formatCurrency } from "@/lib/utils";

interface ExportResultsProps {
  results: CalculationResult[];
  scenarios: ScenarioInputs[];
  desiredIncome: number;
  filingStatus: FilingStatus;
}

const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: "Single",
  marriedJointly: "Married Filing Jointly",
  marriedSeparately: "Married Filing Separately",
  headOfHousehold: "Head of Household",
};

export const ExportResults = memo(function ExportResults({
  results,
  scenarios,
  desiredIncome,
  filingStatus,
}: ExportResultsProps) {
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const exportAsPDF = async () => {
    setGeneratingPdf(true);
    try {
      const { generatePDF } = await import("@/lib/pdfGenerator");
      await generatePDF({ results, desiredIncome, filingStatus });
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const exportAsCSV = () => {
    const headers = [
      "Scenario",
      "Work State",
      "Residence State",
      "Work City",
      "Gross Pre-Tax Income",
      "Net Income",
      "Federal Tax",
      "Social Security",
      "Medicare",
      "State Tax (Work)",
      "State Tax (Residence)",
      "City Tax",
      "SDI/PFML",
      "Pre-Tax Benefits",
      "Total Tax",
      "Effective Tax Rate",
    ];

    const rows = results.map((r, i) => [
      `Scenario ${i + 1}`,
      r.workState,
      r.residenceState,
      r.workCity,
      r.grossPretaxIncome.toFixed(2),
      r.netIncome.toFixed(2),
      r.federalTax.toFixed(2),
      r.socialSecurityTax.toFixed(2),
      r.medicareTax.toFixed(2),
      r.stateTaxWork.toFixed(2),
      r.stateTaxResidence.toFixed(2),
      r.cityTax.toFixed(2),
      r.sdiTax.toFixed(2),
      r.totalBenefitDeductions.toFixed(2),
      r.totalTax.toFixed(2),
      ((r.totalTax / r.grossPretaxIncome) * 100).toFixed(2) + "%",
    ]);

    const inputSummary = [
      "",
      "Input Summary",
      `Desired Post-Tax Income,${desiredIncome}`,
      `Filing Status,${FILING_STATUS_LABELS[filingStatus]}`,
      "",
      "Scenario Benefits",
      ...scenarios.map(
        (s, i) =>
          `Scenario ${i + 1},Health: ${s.healthInsurance}, Dental: ${s.dentalVision}, HSA: ${s.hsa}, FSA: ${s.fsa}, 401k: ${s.retirement401k}, Other: ${s.otherPretax}`
      ),
    ];

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
      "",
      ...inputSummary,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `tax-calculation-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (results.length === 0) return null;

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"></div>
            <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
              Summary
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportAsCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportAsPDF} disabled={generatingPdf}>
              {generatingPdf ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              PDF Report
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="py-2 px-3 text-left font-medium text-slate-600 dark:text-slate-400">
                  Scenario
                </th>
                <th className="py-2 px-3 text-right font-medium text-slate-600 dark:text-slate-400">
                  Gross Income
                </th>
                <th className="py-2 px-3 text-right font-medium text-slate-600 dark:text-slate-400">
                  Total Tax
                </th>
                <th className="py-2 px-3 text-right font-medium text-slate-600 dark:text-slate-400">
                  Eff. Rate
                </th>
                <th className="py-2 px-3 text-right font-medium text-slate-600 dark:text-slate-400">
                  Net Income
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                    {r.workState}/{r.residenceState}
                    {r.workCity !== "N/A" && ` (${r.workCity})`}
                  </td>
                  <td className="py-2 px-3 text-right font-medium text-slate-900 dark:text-slate-100">
                    {formatCurrency(r.grossPretaxIncome)}
                  </td>
                  <td className="py-2 px-3 text-right text-red-600 dark:text-red-400">
                    {formatCurrency(r.totalTax)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400">
                    {((r.totalTax / r.grossPretaxIncome) * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(r.netIncome)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Target Income:</span>
              <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">
                {formatCurrency(desiredIncome)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Filing Status:</span>
              <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">
                {FILING_STATUS_LABELS[filingStatus]}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Scenarios:</span>
              <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">
                {results.length}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Tax Year:</span>
              <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">
                2025
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
