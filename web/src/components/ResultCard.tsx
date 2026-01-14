import { memo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import type { CalculationResult } from "@/types/tax";
import { formatCurrency } from "@/lib/utils";

interface ResultCardProps {
  result: CalculationResult;
  index: number;
}

interface ResultRowProps {
  label: string;
  amount: number;
  grossIncome: number;
  showPercent?: boolean;
}

function ResultRow({ label, amount, grossIncome, showPercent = true }: ResultRowProps) {
  const percent = grossIncome > 0 ? (amount / grossIncome) * 100 : 0;

  return (
    <tr className="border-b border-slate-200 dark:border-slate-700 last:border-0">
      <td className="py-1.5 text-sm text-slate-600 dark:text-slate-400">{label}</td>
      <td className="py-1.5 text-sm text-right font-medium text-slate-900 dark:text-slate-100">
        {formatCurrency(amount)}
      </td>
      <td className="py-1.5 text-sm text-right text-slate-500 dark:text-slate-400 w-16">
        {showPercent ? `${percent.toFixed(1)}%` : ""}
      </td>
    </tr>
  );
}

export const ResultCard = memo(function ResultCard({ result, index }: ResultCardProps) {
  const gross = result.grossPretaxIncome;
  const netDiff = result.netIncome - result.postTaxTarget;
  const isConverged = Math.abs(netDiff) <= 0.5;

  return (
    <Card className="min-w-[320px] max-w-[360px] flex-shrink-0 hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-success to-gradient-to text-white text-sm font-bold">
            {index + 1}
          </span>
          <CardTitle className="text-base text-slate-900 dark:text-slate-100">
            {result.workState}/{result.residenceState}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="py-1.5 text-xs font-medium text-left text-slate-500 dark:text-slate-400">
                Item
              </th>
              <th className="py-1.5 text-xs font-medium text-right text-slate-500 dark:text-slate-400">
                Amount
              </th>
              <th className="py-1.5 text-xs font-medium text-right text-slate-500 dark:text-slate-400 w-16">
                % Gross
              </th>
            </tr>
          </thead>
          <tbody>
            <ResultRow
              label="Net Income"
              amount={result.netIncome}
              grossIncome={gross}
            />
            <ResultRow
              label="Federal Income Tax"
              amount={result.federalTax}
              grossIncome={gross}
            />
            <ResultRow
              label="Social Security Tax"
              amount={result.socialSecurityTax}
              grossIncome={gross}
            />
            <ResultRow
              label="Medicare Tax"
              amount={result.medicareTax}
              grossIncome={gross}
            />
            <ResultRow
              label="State Tax (Work)"
              amount={result.stateTaxWork}
              grossIncome={gross}
            />
            {result.stateTaxResidence > 0 && (
              <ResultRow
                label="State Tax (Residence)"
                amount={result.stateTaxResidence}
                grossIncome={gross}
              />
            )}
            {result.cityTax > 0 && (
              <ResultRow
                label="City Tax"
                amount={result.cityTax}
                grossIncome={gross}
              />
            )}
            {result.sdiTax > 0 && (
              <ResultRow
                label="SDI/PFML Tax"
                amount={result.sdiTax}
                grossIncome={gross}
              />
            )}
            <ResultRow
              label="Pre-Tax Benefits"
              amount={result.totalBenefitDeductions}
              grossIncome={gross}
            />
            <ResultRow
              label="Total Tax"
              amount={result.totalTax}
              grossIncome={gross}
            />
          </tbody>
        </table>

        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Gross Pre-Tax Income:</span>
            <span className="text-lg font-bold text-sky-600 dark:text-sky-400">
              {formatCurrency(gross)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">Target vs Calculated:</span>
            <span
              className={`text-xs font-medium ${
                isConverged ? "text-green-600" : "text-amber-600"
              }`}
            >
              {netDiff >= 0 ? "+" : ""}
              {formatCurrency(netDiff)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
