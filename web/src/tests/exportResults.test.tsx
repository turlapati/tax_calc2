import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExportResults } from "@/components/ExportResults";
import type { CalculationResult, ScenarioInputs } from "@/types/tax";
import { toPng } from "html-to-image";

// Mock jsPDF
const mockSave = vi.fn();
const mockAddImage = vi.fn();
const mockAddPage = vi.fn();

vi.mock("jspdf", () => {
  return {
    jsPDF: vi.fn().mockImplementation(function() {
      return {
        internal: {
          pageSize: {
            getWidth: () => 210,
            getHeight: () => 297,
          },
        },
        setFillColor: vi.fn(),
        rect: vi.fn(),
        setTextColor: vi.fn(),
        setFontSize: vi.fn(),
        setFont: vi.fn(),
        text: vi.fn(),
        splitTextToSize: vi.fn().mockReturnValue(["line1"]),
        roundedRect: vi.fn(),
        addImage: mockAddImage,
        addPage: mockAddPage,
        save: mockSave,
      };
    }),
  };
});

// Mock html-to-image
vi.mock("html-to-image", () => ({
  toPng: vi.fn().mockResolvedValue("data:image/png;base64,fake-data"),
}));

const mockResults: CalculationResult[] = [
  {
    scenarioId: "test-1",
    grossPretaxIncome: 150000,
    federalTax: 25000,
    stateTaxWork: 8000,
    stateTaxResidence: 0,
    cityTax: 3000,
    socialSecurityTax: 9300,
    medicareTax: 2175,
    sdiTax: 500,
    totalBenefitDeductions: 10000,
    totalTax: 47975,
    netIncome: 92025,
    workState: "NY",
    residenceState: "NY",
    workCity: "NYC",
    postTaxTarget: 92000,
  },
  {
    scenarioId: "test-2",
    grossPretaxIncome: 140000,
    federalTax: 23000,
    stateTaxWork: 0,
    stateTaxResidence: 0,
    cityTax: 0,
    socialSecurityTax: 8680,
    medicareTax: 2030,
    sdiTax: 0,
    totalBenefitDeductions: 10000,
    totalTax: 33710,
    netIncome: 96290,
    workState: "TX",
    residenceState: "TX",
    workCity: "N/A",
    postTaxTarget: 92000,
  },
];

const mockScenarios: ScenarioInputs[] = [
  {
    id: "test-1",
    workState: "NY",
    residenceState: "NY",
    workCity: "NYC",
    healthInsurance: 5000,
    dentalVision: 500,
    hsa: 3000,
    fsa: 0,
    retirement401k: 1500,
    otherPretax: 0,
  },
  {
    id: "test-2",
    workState: "TX",
    residenceState: "TX",
    workCity: "N/A",
    healthInsurance: 5000,
    dentalVision: 500,
    hsa: 3000,
    fsa: 0,
    retirement401k: 1500,
    otherPretax: 0,
  },
];

describe("ExportResults Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders Summary card with results", () => {
      render(
        <ExportResults
          results={mockResults}
          scenarios={mockScenarios}
          desiredIncome={92000}
          filingStatus="single"
        />
      );

      expect(screen.getByText("Summary")).toBeInTheDocument();
    });

    it("renders CSV and PDF buttons", () => {
      render(
        <ExportResults
          results={mockResults}
          scenarios={mockScenarios}
          desiredIncome={92000}
          filingStatus="single"
        />
      );

      expect(screen.getByText("CSV")).toBeInTheDocument();
      expect(screen.getByText("PDF Report")).toBeInTheDocument();
    });

    it("displays scenario locations in table", () => {
      render(
        <ExportResults
          results={mockResults}
          scenarios={mockScenarios}
          desiredIncome={92000}
          filingStatus="single"
        />
      );

      expect(screen.getByText("NY/NY (NYC)")).toBeInTheDocument();
      expect(screen.getByText("TX/TX")).toBeInTheDocument();
    });

    it("displays formatted currency values", () => {
      render(
        <ExportResults
          results={mockResults}
          scenarios={mockScenarios}
          desiredIncome={92000}
          filingStatus="single"
        />
      );

      expect(screen.getByText("$150,000.00")).toBeInTheDocument();
      expect(screen.getByText("$140,000.00")).toBeInTheDocument();
    });

    it("displays effective tax rates", () => {
      render(
        <ExportResults
          results={mockResults}
          scenarios={mockScenarios}
          desiredIncome={92000}
          filingStatus="single"
        />
      );

      expect(screen.getByText("32.0%")).toBeInTheDocument();
      expect(screen.getByText("24.1%")).toBeInTheDocument();
    });

    it("displays filing status label", () => {
      render(
        <ExportResults
          results={mockResults}
          scenarios={mockScenarios}
          desiredIncome={92000}
          filingStatus="marriedJointly"
        />
      );

      expect(screen.getByText("Married Filing Jointly")).toBeInTheDocument();
    });

    it("returns null when no results", () => {
      const { container } = render(
        <ExportResults
          results={[]}
          scenarios={[]}
          desiredIncome={92000}
          filingStatus="single"
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("CSV Export", () => {
    it("triggers CSV download on button click", () => {
      const createObjectURLMock = vi.fn(() => "blob:test");
      URL.createObjectURL = createObjectURLMock;

      const clickMock = vi.fn();
      const originalCreateElement = document.createElement.bind(document);
      const createElementSpy = vi.spyOn(document, "createElement");
      createElementSpy.mockImplementation((tagName: string) => {
        if (tagName === "a") {
          return {
            click: clickMock,
            download: "",
            href: "",
          } as unknown as HTMLAnchorElement;
        }
        return originalCreateElement(tagName);
      });

      render(
        <ExportResults
          results={mockResults}
          scenarios={mockScenarios}
          desiredIncome={92000}
          filingStatus="single"
        />
      );

      const csvButton = screen.getByText("CSV");
      fireEvent.click(csvButton);

      expect(createObjectURLMock).toHaveBeenCalled();
      expect(clickMock).toHaveBeenCalled();

      createElementSpy.mockRestore();
    });
  });

  describe("PDF Export", () => {
    let comparisonContainer: HTMLDivElement;
    let pieContainer: HTMLDivElement;

    // Add dummy chart containers to the document body for selectors to find
    beforeEach(() => {
      comparisonContainer = document.createElement("div");
      comparisonContainer.setAttribute("data-chart-container", "comparison");
      comparisonContainer.style.width = "500px";
      comparisonContainer.style.height = "300px";
      document.body.appendChild(comparisonContainer);

      pieContainer = document.createElement("div");
      pieContainer.setAttribute("data-chart-container", "pie");
      pieContainer.style.width = "500px";
      pieContainer.style.height = "300px";
      document.body.appendChild(pieContainer);
    });

    afterEach(() => {
      if (document.body.contains(comparisonContainer)) {
        document.body.removeChild(comparisonContainer);
      }
      if (document.body.contains(pieContainer)) {
        document.body.removeChild(pieContainer);
      }
    });

    it("triggers PDF generation on button click", async () => {
      render(
        <ExportResults
          results={mockResults}
          scenarios={mockScenarios}
          desiredIncome={92000}
          filingStatus="single"
        />
      );

      const pdfButton = screen.getByText("PDF Report");
      fireEvent.click(pdfButton);

      await waitFor(() => {
        expect(toPng).toHaveBeenCalledTimes(2); // comparison + pie
      }, { timeout: 3000 });

      await waitFor(() => {
        expect(mockSave).toHaveBeenCalled();
      });
      
      expect(mockSave).toHaveBeenCalledWith(expect.stringMatching(/^tax-report-.*\.pdf$/));
    });
  });

  describe("Summary table content", () => {
    it("shows target income", () => {
      render(
        <ExportResults
          results={mockResults}
          scenarios={mockScenarios}
          desiredIncome={92000}
          filingStatus="single"
        />
      );

      expect(screen.getByText("Target Income:")).toBeInTheDocument();
      expect(screen.getByText("$92,000.00")).toBeInTheDocument();
    });

    it("shows scenario count", () => {
      render(
        <ExportResults
          results={mockResults}
          scenarios={mockScenarios}
          desiredIncome={92000}
          filingStatus="single"
        />
      );

      expect(screen.getByText("Scenarios:")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("shows tax year", () => {
      render(
        <ExportResults
          results={mockResults}
          scenarios={mockScenarios}
          desiredIncome={92000}
          filingStatus="single"
        />
      );

      expect(screen.getByText("Tax Year:")).toBeInTheDocument();
      expect(screen.getByText("2025")).toBeInTheDocument();
    });
  });
});
