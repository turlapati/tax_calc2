import { memo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import type { CalculationResult } from "@/types/tax";
import { formatCurrency } from "@/lib/utils";

interface TaxPieChartProps {
  results: CalculationResult[];
}

const COLORS = [
  "#0ea5e9", // sky-500 - Federal
  "#f59e0b", // amber-500 - Social Security
  "#8b5cf6", // violet-500 - Medicare
  "#10b981", // emerald-500 - State Work
  "#06b6d4", // cyan-500 - State Residence
  "#ec4899", // pink-500 - City
  "#f97316", // orange-500 - SDI
  "#6366f1", // indigo-500 - Benefits
];

export const TaxPieChart = memo(function TaxPieChart({ results }: TaxPieChartProps) {
  if (results.length === 0) return null;

  return (
    <Card className="mt-6" data-chart-container="pie">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="h-1 w-8 bg-gradient-to-r from-violet-500 to-pink-400 rounded-full"></div>
          <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
            Tax Breakdown by Scenario
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {results.map((result, index) => {
            const data = [
              { name: "Federal Tax", value: result.federalTax },
              { name: "Social Security", value: result.socialSecurityTax },
              { name: "Medicare", value: result.medicareTax },
              { name: "State Tax (Work)", value: result.stateTaxWork },
              ...(result.stateTaxResidence > 0
                ? [{ name: "State Tax (Res)", value: result.stateTaxResidence }]
                : []),
              ...(result.cityTax > 0
                ? [{ name: "City Tax", value: result.cityTax }]
                : []),
              ...(result.sdiTax > 0
                ? [{ name: "SDI/PFML", value: result.sdiTax }]
                : []),
              { name: "Pre-Tax Benefits", value: result.totalBenefitDeductions },
            ].filter((d) => d.value > 0);

            const total = data.reduce((sum, d) => sum + d.value, 0);

            return (
              <div key={index} className="text-center">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {result.workState}/{result.residenceState}
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      {data.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        `${formatCurrency(value as number)} (${(((value as number) / total) * 100).toFixed(1)}%)`,
                        "",
                      ]}
                      contentStyle={{
                        backgroundColor: "var(--color-card, white)",
                        border: "1px solid var(--color-border, #e2e8f0)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "var(--color-foreground, #0f172a)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Total: {formatCurrency(total)}
                </p>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          {[
            { name: "Federal Tax", color: COLORS[0] },
            { name: "Social Security", color: COLORS[1] },
            { name: "Medicare", color: COLORS[2] },
            { name: "State Tax", color: COLORS[3] },
            { name: "City Tax", color: COLORS[5] },
            { name: "SDI/PFML", color: COLORS[6] },
            { name: "Benefits", color: COLORS[7] },
          ].map((item) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
