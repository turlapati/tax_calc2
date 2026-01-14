import type { TaxData } from "@/types/tax";
import { TaxDataSchema } from "@/schemas/taxData";
import defaultTaxData2025 from "@/data/tax-data-2025.json";

const CACHE_KEY_PREFIX = "tax-data-";
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedData {
  data: TaxData;
  timestamp: number;
}

interface TaxDataProvider {
  getTaxData(year: number): Promise<TaxData>;
  getAvailableYears(): Promise<number[]>;
  clearCache(): void;
}

class LocalTaxDataProvider implements TaxDataProvider {
  private remoteBaseUrl: string | null = null;

  constructor(remoteBaseUrl?: string) {
    this.remoteBaseUrl = remoteBaseUrl || null;
  }

  async getTaxData(year: number): Promise<TaxData> {
    // Try cache first
    const cached = this.getFromCache(year);
    if (cached) {
      return cached;
    }

    // Try remote fetch if configured
    if (this.remoteBaseUrl) {
      try {
        const remoteData = await this.fetchRemote(year);
        if (remoteData) {
          this.saveToCache(year, remoteData);
          return remoteData;
        }
      } catch (error) {
        console.warn(`Failed to fetch remote tax data for ${year}, using bundled data`, error);
      }
    }

    // Fall back to bundled data
    return this.getBundledData(year);
  }

  async getAvailableYears(): Promise<number[]> {
    // For now, only 2025 is available
    // Future: fetch from remote or scan bundled files
    return [2025];
  }

  clearCache(): void {
    if (typeof window === "undefined") return;
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  private getFromCache(year: number): TaxData | null {
    if (typeof window === "undefined") return null;
    
    try {
      const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${year}`);
      if (!cached) return null;

      const parsed: CachedData = JSON.parse(cached);
      const isExpired = Date.now() - parsed.timestamp > CACHE_EXPIRY_MS;
      
      if (isExpired) {
        localStorage.removeItem(`${CACHE_KEY_PREFIX}${year}`);
        return null;
      }

      const validationResult = TaxDataSchema.safeParse(parsed.data);
      if (!validationResult.success) {
        console.warn("Cached tax data failed validation, clearing cache", validationResult.error);
        localStorage.removeItem(`${CACHE_KEY_PREFIX}${year}`);
        return null;
      }

      return validationResult.data as TaxData;
    } catch {
      return null;
    }
  }

  private saveToCache(year: number, data: TaxData): void {
    if (typeof window === "undefined") return;
    
    try {
      const cached: CachedData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(`${CACHE_KEY_PREFIX}${year}`, JSON.stringify(cached));
    } catch (error) {
      console.warn("Failed to cache tax data", error);
    }
  }

  private async fetchRemote(year: number): Promise<TaxData | null> {
    if (!this.remoteBaseUrl) return null;

    const response = await fetch(`${this.remoteBaseUrl}/tax-data-${year}.json`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const rawData: unknown = await response.json();
    const validationResult = TaxDataSchema.safeParse(rawData);
    if (!validationResult.success) {
      console.error("Remote tax data failed validation", validationResult.error);
      throw new Error("Invalid tax data format from remote source");
    }
    return validationResult.data as TaxData;
  }

  private getBundledData(year: number): TaxData {
    // Map of bundled data files
    const bundledDataMap: Record<number, unknown> = {
      2025: defaultTaxData2025,
    };

    const rawData = bundledDataMap[year];
    if (!rawData) {
      throw new Error(`No tax data available for year ${year}`);
    }

    const validationResult = TaxDataSchema.safeParse(rawData);
    if (!validationResult.success) {
      console.error("Bundled tax data failed validation", validationResult.error);
      throw new Error(`Invalid bundled tax data for year ${year}`);
    }
    return validationResult.data as TaxData;
  }
}

// Future: Firebase/Supabase provider
// class FirebaseTaxDataProvider implements TaxDataProvider {
//   async getTaxData(year: number): Promise<TaxData> {
//     // Fetch from Firestore
//     // const doc = await getDoc(doc(db, 'taxData', year.toString()));
//     // return doc.data() as TaxData;
//   }
//   async getAvailableYears(): Promise<number[]> {
//     // Query Firestore for available years
//   }
//   clearCache(): void {
//     // Clear any local cache
//   }
// }

// Singleton instance - can be swapped for different providers
let provider: TaxDataProvider = new LocalTaxDataProvider(
  import.meta.env.VITE_TAX_DATA_URL || undefined
);

export const taxDataService = {
  getTaxData: (year: number) => provider.getTaxData(year),
  getAvailableYears: () => provider.getAvailableYears(),
  clearCache: () => provider.clearCache(),
  
  // Allow swapping provider at runtime (for future DB migration)
  setProvider: (newProvider: TaxDataProvider) => {
    provider = newProvider;
  },
};

export type { TaxDataProvider };
