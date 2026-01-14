import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";
import type { CalculationResult, FilingStatus } from "@/types/tax";
import { formatCurrency } from "@/lib/utils";

const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: "Single",
  marriedJointly: "Married Filing Jointly",
  marriedSeparately: "Married Filing Separately",
  headOfHousehold: "Head of Household",
};

const DISCLAIMER_TEXT = `DISCLAIMER: Estimates based on simplified 2025 tax rules. Does not include standard/itemized deductions, tax credits, AMT, NIIT, or self-employment tax. Assumes W-2 income only. Consult a tax professional for accurate advice.`;

async function captureChart(selector: string): Promise<string | null> {
  const chartElement = document.querySelector(`[data-chart-container="${selector}"]`) as HTMLElement;
  if (!chartElement) {
    return null;
  }

  const isDark = document.documentElement.classList.contains("dark");

  try {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    
    const dataUrl = await toPng(chartElement, {
      backgroundColor: "#ffffff",
      pixelRatio: 2,
      cacheBust: true,
    });
    
    return dataUrl;
  } catch (err) {
    console.error(`Failed to capture chart ${selector}:`, err);
    return null;
  } finally {
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
  }
}

export interface PDFGeneratorParams {
  results: CalculationResult[];
  desiredIncome: number;
  filingStatus: FilingStatus;
}

export async function generatePDF({
  results,
  desiredIncome,
  filingStatus,
}: PDFGeneratorParams): Promise<void> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - 2 * margin;
  
  const addHeader = () => {
    pdf.setFillColor(14, 165, 233);
    pdf.rect(0, 0, pageWidth, 16, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Post-Tax Income Calculator", margin, 11);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Tax Year 2025 | ${new Date().toLocaleDateString()}`, pageWidth - margin, 11, { align: "right" });
    pdf.setTextColor(0, 0, 0);
  };
  
  const addFooter = (pageNum: number, totalPages: number) => {
    pdf.setFontSize(6);
    pdf.setTextColor(120, 120, 120);
    const lines = pdf.splitTextToSize(DISCLAIMER_TEXT, contentWidth);
    pdf.text(lines, margin, pageHeight - 12);
    pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: "right" });
    pdf.setTextColor(0, 0, 0);
  };

  addHeader();
  let y = 22;
  
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Target: ${formatCurrency(desiredIncome)}  |  Filing: ${FILING_STATUS_LABELS[filingStatus]}  |  Scenarios: ${results.length}`, margin, y);
  y += 8;
  
  const sortedByGross = [...results].sort((a, b) => a.grossPretaxIncome - b.grossPretaxIncome);
  const lowestGross = sortedByGross[0];
  const highestGross = sortedByGross[sortedByGross.length - 1];
  const savings = highestGross.grossPretaxIncome - lowestGross.grossPretaxIncome;
  const lowestIdx = results.findIndex(r => r.scenarioId === lowestGross.scenarioId) + 1;
  
  pdf.setFillColor(236, 253, 245);
  pdf.roundedRect(margin, y, contentWidth, 14, 2, 2, "F");
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(16, 185, 129);
  pdf.text("BEST:", margin + 3, y + 5);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Scenario ${lowestIdx} (${lowestGross.workState}/${lowestGross.residenceState}) - ${formatCurrency(lowestGross.grossPretaxIncome)} gross, ${((lowestGross.totalTax / lowestGross.grossPretaxIncome) * 100).toFixed(1)}% eff. rate`, margin + 18, y + 5);
  if (results.length > 1) {
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(180, 83, 9);
    pdf.text(`Potential savings: ${formatCurrency(savings)}/year`, margin + 3, y + 11);
  }
  pdf.setTextColor(0, 0, 0);
  y += 18;
  
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("Scenario Comparison", margin, y);
  y += 6;
  
  const headers = ["", ...results.map((r, i) => `${i + 1}: ${r.workState}/${r.residenceState}`)];
  const colWidth = contentWidth / headers.length;
  
  pdf.setFillColor(14, 165, 233);
  pdf.rect(margin, y, contentWidth, 6, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  headers.forEach((h, i) => {
    pdf.text(h, margin + i * colWidth + colWidth / 2, y + 4, { align: "center" });
  });
  pdf.setTextColor(0, 0, 0);
  y += 6;
  
  const rows = [
    ["Gross Income", ...results.map(r => formatCurrency(r.grossPretaxIncome))],
    ["Federal Tax", ...results.map(r => formatCurrency(r.federalTax))],
    ["State Tax", ...results.map(r => formatCurrency(r.stateTaxWork + r.stateTaxResidence))],
    ["FICA", ...results.map(r => formatCurrency(r.socialSecurityTax + r.medicareTax))],
    ["Other (City/SDI)", ...results.map(r => formatCurrency(r.cityTax + r.sdiTax))],
    ["Benefits", ...results.map(r => formatCurrency(r.totalBenefitDeductions))],
    ["Total Tax", ...results.map(r => formatCurrency(r.totalTax))],
    ["Eff. Rate", ...results.map(r => `${((r.totalTax / r.grossPretaxIncome) * 100).toFixed(1)}%`)],
    ["Net Income", ...results.map(r => formatCurrency(r.netIncome))],
  ];
  
  pdf.setFont("helvetica", "normal");
  rows.forEach((row, rowIdx) => {
    const isHighlight = row[0] === "Total Tax" || row[0] === "Net Income" || row[0] === "Gross Income";
    if (isHighlight) {
      pdf.setFillColor(240, 249, 255);
      pdf.rect(margin, y, contentWidth, 5, "F");
      pdf.setFont("helvetica", "bold");
    } else if (rowIdx % 2 === 1) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, y, contentWidth, 5, "F");
      pdf.setFont("helvetica", "normal");
    } else {
      pdf.setFont("helvetica", "normal");
    }
    
    pdf.setFontSize(7);
    row.forEach((cell, i) => {
      const align = i === 0 ? "left" : "center";
      const xPos = i === 0 ? margin + 2 : margin + i * colWidth + colWidth / 2;
      pdf.text(cell, xPos, y + 3.5, { align });
    });
    y += 5;
  });
  
  y += 6;
  
  const barChartImage = await captureChart("comparison");
  if (barChartImage) {
    const chartHeight = 65;
    if (y + chartHeight > pageHeight - 25) {
      addFooter(1, 2);
      pdf.addPage();
      addHeader();
      y = 22;
    }
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("Tax Breakdown Chart", margin, y);
    y += 4;
    pdf.addImage(barChartImage, "PNG", margin, y, contentWidth, chartHeight);
    y += chartHeight + 4;
  }
  
  const pieChartImage = await captureChart("pie");
  if (pieChartImage) {
    const pieHeight = 55;
    if (y + pieHeight > pageHeight - 25) {
      addFooter(1, 2);
      pdf.addPage();
      addHeader();
      y = 22;
    }
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("Tax Distribution by Scenario", margin, y);
    y += 4;
    pdf.addImage(pieChartImage, "PNG", margin, y, contentWidth, pieHeight);
    y += pieHeight + 4;
  }
  
  const totalPages = 1;
  addFooter(1, totalPages);
  
  pdf.save(`tax-report-${new Date().toISOString().split("T")[0]}.pdf`);
}
