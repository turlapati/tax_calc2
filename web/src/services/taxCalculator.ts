import type {
  TaxData,
  TaxBracket,
  FilingStatus,
  ScenarioInputs,
  CalculationResult,
} from "@/types/tax";

const MAX_ITERATIONS = 150;
const TOLERANCE = 0.5;
const ADJUSTMENT_FACTOR = 0.7;
const ESTIMATED_TAX_RATE_INITIAL_GUESS = 0.4;

export function calculateIncomeTax(income: number, brackets: TaxBracket[]): number {
  if (!brackets || brackets.length === 0 || income <= 0) {
    return 0;
  }

  let tax = 0;
  let incomeInPreviousBrackets = 0;

  for (const bracket of brackets) {
    const lowerBound = incomeInPreviousBrackets;
    const upperBound = bracket.maxIncome === -1 ? Infinity : bracket.maxIncome;

    if (income <= lowerBound) break;

    const taxableInThisBracket = Math.min(income, upperBound) - lowerBound;
    if (taxableInThisBracket > 0) {
      tax += taxableInThisBracket * bracket.rate;
    }

    incomeInPreviousBrackets = upperBound;
    if (upperBound === Infinity) break;
  }

  return Math.max(tax, 0);
}

export function calculateFICA(
  grossIncome: number,
  filingStatus: FilingStatus,
  taxData: TaxData
): { socialSecurityTax: number; medicareTax: number } {
  const income = Math.max(grossIncome, 0);
  const fica = taxData.fica;

  // Social Security
  const taxableForSS = Math.min(income, fica.socialSecurityLimit);
  const socialSecurityTax = taxableForSS * fica.socialSecurityRate;

  // Medicare
  let medicareTax = income * fica.medicareRate;
  const additionalThreshold = fica.medicareAdditionalThresholds[filingStatus];
  if (income > additionalThreshold) {
    medicareTax += (income - additionalThreshold) * fica.medicareAdditionalRate;
  }

  return { socialSecurityTax, medicareTax };
}

export function calculateSDI(
  grossIncome: number,
  workState: string,
  taxData: TaxData
): number {
  const income = Math.max(grossIncome, 0);
  const sdiRates = taxData.sdi;

  if (!(workState in sdiRates)) {
    return 0;
  }

  const sdiInfo = sdiRates[workState];

  // States with weekly max deduction (NY, HI)
  if (sdiInfo.maxWeeklyDeduction !== null) {
    return sdiInfo.maxWeeklyDeduction * 52;
  }

  // States with percentage rate and wage cap
  let taxableWage = income;
  if (sdiInfo.maxWage !== null) {
    taxableWage = Math.min(income, sdiInfo.maxWage);
  }

  let sdiTax = taxableWage * sdiInfo.rate;

  if (sdiInfo.maxContribution !== null) {
    sdiTax = Math.min(sdiTax, sdiInfo.maxContribution);
  }

  return Math.max(sdiTax, 0);
}

function getTotalBenefitDeductions(inputs: ScenarioInputs): number {
  return (
    inputs.healthInsurance +
    inputs.dentalVision +
    inputs.hsa +
    inputs.fsa +
    inputs.retirement401k +
    inputs.otherPretax
  );
}

export function solveForGrossIncome(
  targetNet: number,
  inputs: ScenarioInputs,
  filingStatus: FilingStatus,
  taxData: TaxData
): CalculationResult {
  if (!inputs.workState || !inputs.residenceState) {
    throw new Error("Work State and Residence State must be selected.");
  }

  const totalBenefits = getTotalBenefitDeductions(inputs);

  // Initial guess: target + benefits + estimated taxes
  const estimatedInitialTaxes = targetNet * ESTIMATED_TAX_RATE_INITIAL_GUESS;
  let currentGuess = targetNet + totalBenefits + estimatedInitialTaxes;

  let federalTax = 0;
  let stateTaxWork = 0;
  let stateTaxResidence = 0;
  let cityTax = 0;
  let socialSecurityTax = 0;
  let medicareTax = 0;
  let sdiTax = 0;
  let totalTax = 0;
  let calculatedNet = 0;
  let difference = Infinity;

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    currentGuess = Math.max(currentGuess, 0);

    // Calculate FICA and SDI based on gross income
    const fica = calculateFICA(currentGuess, filingStatus, taxData);
    socialSecurityTax = fica.socialSecurityTax;
    medicareTax = fica.medicareTax;
    sdiTax = calculateSDI(currentGuess, inputs.workState, taxData);

    // Taxable income for income taxes (gross minus pre-tax benefits)
    const taxableIncomeForIncomeTax = Math.max(0, currentGuess - totalBenefits);

    // Federal income tax
    const federalBrackets = taxData.federal[filingStatus];
    federalTax = calculateIncomeTax(taxableIncomeForIncomeTax, federalBrackets);

    // State income tax (work state)
    const workStateBrackets = taxData.state[inputs.workState] || [];
    stateTaxWork = calculateIncomeTax(taxableIncomeForIncomeTax, workStateBrackets);

    // State income tax (residence state) - simplified reciprocity
    stateTaxResidence = 0;
    if (inputs.workState !== inputs.residenceState) {
      const residenceStateBrackets = taxData.state[inputs.residenceState] || [];
      const potentialResidenceTax = calculateIncomeTax(
        taxableIncomeForIncomeTax,
        residenceStateBrackets
      );
      stateTaxResidence = Math.max(0, potentialResidenceTax - stateTaxWork);
    }

    // City income tax
    cityTax = 0;
    if (inputs.workCity && inputs.workCity !== "N/A") {
      const cityBrackets = taxData.city[inputs.workState]?.[inputs.workCity];
      if (cityBrackets) {
        cityTax = calculateIncomeTax(taxableIncomeForIncomeTax, cityBrackets);
      }
    }

    // Total tax and net income
    totalTax =
      federalTax +
      stateTaxWork +
      stateTaxResidence +
      cityTax +
      socialSecurityTax +
      medicareTax +
      sdiTax;

    calculatedNet = currentGuess - totalTax - totalBenefits;
    difference = calculatedNet - targetNet;

    // Check for convergence
    if (Math.abs(difference) <= TOLERANCE) {
      break;
    }

    // Adjust guess for next iteration
    const adjustment = difference * ADJUSTMENT_FACTOR;
    currentGuess -= adjustment;
  }

  if (Math.abs(difference) > TOLERANCE) {
    console.warn(
      `Warning: Failed to converge after ${MAX_ITERATIONS} iterations. Last difference: ${difference.toFixed(2)}`
    );
  }

  return {
    scenarioId: inputs.id,
    grossPretaxIncome: round(currentGuess),
    federalTax: round(federalTax),
    stateTaxWork: round(stateTaxWork),
    stateTaxResidence: round(stateTaxResidence),
    cityTax: round(cityTax),
    socialSecurityTax: round(socialSecurityTax),
    medicareTax: round(medicareTax),
    sdiTax: round(sdiTax),
    totalBenefitDeductions: round(totalBenefits),
    totalTax: round(totalTax),
    netIncome: round(calculatedNet),
    workState: inputs.workState,
    residenceState: inputs.residenceState,
    workCity: inputs.workCity,
    postTaxTarget: targetNet,
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
