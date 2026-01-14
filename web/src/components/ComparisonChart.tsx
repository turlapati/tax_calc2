import { memo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { CalculationResult } from "@/types/tax";
import { formatCurrency } from "@/lib/utils";

interface ComparisonChartProps {
  results: CalculationResult[];
}

interface ChartDataItem {
  name: string;
  federalTax: number;
  socialSecurity: number;
  medicare: number;
  stateTaxWork: number;
  stateTaxResidence: number;
  cityTax: number;
  sdiTax: number;
  benefits: number;
}

const COLORS = {
  federalTax: "#dc2626",
  socialSecurity: "#2563eb",
  medicare: "#0891b2",
  stateTaxWork: "#eab308",
  stateTaxResidence: "#f97316",
  cityTax: "#8b5cf6",
  sdiTax: "#6b7280",
  benefits: "#22c55e",
};

export const ComparisonChart = memo(function ComparisonChart({ results }: ComparisonChartProps) {
  if (results.length === 0) return null;

  const chartData: ChartDataItem[] = results.map((r, i) => ({
    name: `Scenario ${i + 1}\n${r.workState}/${r.residenceState}`,
    federalTax: r.federalTax,
    socialSecurity: r.socialSecurityTax,
    medicare: r.medicareTax,
    stateTaxWork: r.stateTaxWork,
    stateTaxResidence: r.stateTaxResidence,
    cityTax: r.cityTax,
    sdiTax: r.sdiTax,
    benefits: r.totalBenefitDeductions,
  }));

  const hasStateTaxResidence = results.some((r) => r.stateTaxResidence > 0.01);
  const hasCityTax = results.some((r) => r.cityTax > 0.01);
  const hasSDI = results.some((r) => r.sdiTax > 0.01);
  const hasBenefits = results.some((r) => r.totalBenefitDeductions > 0.01);

  return (
    <div className="w-full h-[400px] mt-6" data-chart-container="comparison">
      <h3 className="text-lg font-semibold mb-4">Tax & Deduction Comparison</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            interval={0}
            angle={0}
            textAnchor="middle"
            height={60}
          />
          <YAxis
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value) => formatCurrency(value as number)}
            contentStyle={{
              backgroundColor: "var(--color-card, white)",
              border: "1px solid var(--color-border, #e2e8f0)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "var(--color-foreground, #0f172a)",
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }}
            iconType="rect"
          />
          <Bar
            dataKey="federalTax"
            name="Federal Tax"
            stackId="a"
            fill={COLORS.federalTax}
            isAnimationActive={false}
          />
          <Bar
            dataKey="socialSecurity"
            name="Social Security"
            stackId="a"
            fill={COLORS.socialSecurity}
            isAnimationActive={false}
          />
          <Bar
            dataKey="medicare"
            name="Medicare"
            stackId="a"
            fill={COLORS.medicare}
            isAnimationActive={false}
          />
          <Bar
            dataKey="stateTaxWork"
            name="State Tax (Work)"
            stackId="a"
            fill={COLORS.stateTaxWork}
            isAnimationActive={false}
          />
            {hasStateTaxResidence && (
            <Bar
              dataKey="stateTaxResidence"
              name="State Tax (Res)"
              stackId="a"
              fill={COLORS.stateTaxResidence}
              isAnimationActive={false}
            />
          )}
          {hasCityTax && (
            <Bar
              dataKey="cityTax"
              name="City Tax"
              stackId="a"
              fill={COLORS.cityTax}
              isAnimationActive={false}
            />
          )}
          {hasSDI && (
            <Bar
              dataKey="sdiTax"
              name="SDI/PFML"
              stackId="a"
              fill={COLORS.sdiTax}
              isAnimationActive={false}
            />
          )}
          {hasBenefits && (
            <Bar
              dataKey="benefits"
              name="Pre-Tax Benefits"
              stackId="a"
              fill={COLORS.benefits}
              isAnimationActive={false}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
