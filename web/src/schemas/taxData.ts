import { z } from "zod";

export const TaxBracketSchema = z.object({
  rate: z.number(),
  maxIncome: z.number(),
});

export const FilingStatusSchema = z.enum([
  "single",
  "marriedJointly",
  "marriedSeparately",
  "headOfHousehold",
]);

export const FederalTaxBracketsSchema = z.object({
  single: z.array(TaxBracketSchema),
  marriedJointly: z.array(TaxBracketSchema),
  marriedSeparately: z.array(TaxBracketSchema),
  headOfHousehold: z.array(TaxBracketSchema),
});

export const StateTaxBracketsSchema = z.record(z.string(), z.array(TaxBracketSchema));

export const CityTaxRatesSchema = z.record(
  z.string(),
  z.record(z.string(), z.array(TaxBracketSchema))
);

export const FICARatesSchema = z.object({
  socialSecurityRate: z.number(),
  socialSecurityLimit: z.number(),
  medicareRate: z.number(),
  medicareAdditionalRate: z.number(),
  medicareAdditionalThresholds: z.object({
    single: z.number(),
    marriedJointly: z.number(),
    marriedSeparately: z.number(),
    headOfHousehold: z.number(),
  }),
});

export const SDIRateSchema = z.object({
  rate: z.number(),
  maxWage: z.number().nullable(),
  maxContribution: z.number().nullable(),
  maxWeeklyDeduction: z.number().nullable(),
});

export const SDIRatesSchema = z.record(z.string(), SDIRateSchema);

export const TaxDataSchema = z.object({
  year: z.number(),
  version: z.string(),
  lastUpdated: z.string(),
  federal: FederalTaxBracketsSchema,
  state: StateTaxBracketsSchema,
  city: CityTaxRatesSchema,
  fica: FICARatesSchema,
  sdi: SDIRatesSchema,
});

export const ScenarioInputsSchema = z.object({
  id: z.string(),
  workState: z.string(),
  residenceState: z.string(),
  workCity: z.string(),
  healthInsurance: z.number(),
  dentalVision: z.number(),
  hsa: z.number(),
  fsa: z.number(),
  retirement401k: z.number(),
  otherPretax: z.number(),
});

export const CalculationResultSchema = z.object({
  scenarioId: z.string(),
  grossPretaxIncome: z.number(),
  federalTax: z.number(),
  stateTaxWork: z.number(),
  stateTaxResidence: z.number(),
  cityTax: z.number(),
  socialSecurityTax: z.number(),
  medicareTax: z.number(),
  sdiTax: z.number(),
  totalBenefitDeductions: z.number(),
  totalTax: z.number(),
  netIncome: z.number(),
  workState: z.string(),
  residenceState: z.string(),
  workCity: z.string(),
  postTaxTarget: z.number(),
});

export type TaxBracket = z.infer<typeof TaxBracketSchema>;
export type FilingStatus = z.infer<typeof FilingStatusSchema>;
export type FederalTaxBrackets = z.infer<typeof FederalTaxBracketsSchema>;
export type StateTaxBrackets = z.infer<typeof StateTaxBracketsSchema>;
export type CityTaxRates = z.infer<typeof CityTaxRatesSchema>;
export type FICARates = z.infer<typeof FICARatesSchema>;
export type SDIRate = z.infer<typeof SDIRateSchema>;
export type SDIRates = z.infer<typeof SDIRatesSchema>;
export type TaxData = z.infer<typeof TaxDataSchema>;
export type ScenarioInputs = z.infer<typeof ScenarioInputsSchema>;
export type CalculationResult = z.infer<typeof CalculationResultSchema>;
