/**
 * VAT calculation logic for FashionVoid
 * 
 * IMPORTANT: All product prices are VAT-INCLUSIVE and always include 21% VAT
 * This applies to ALL customers regardless of location (Netherlands standard)
 * 
 * VAT Rate: Always 21% (Netherlands rate)
 * - All customers pay the same price (including 21% VAT)
 * - No country-based VAT rate variations
 * 
 * Note: We extract VAT from VAT-inclusive prices for accounting purposes
 */

// VAT rate: Always 21% (Netherlands rate) for all customers
const VAT_RATE = 0.21

export interface VATCalculationInput {
  subtotal: number // Subtotal including VAT (VAT-inclusive price)
  country?: string // Optional country code (not used for calculation, always 21%)
}

export interface VATResult {
  rate: number // VAT rate as decimal (always 0.21 for 21%)
  amount: number // VAT amount extracted from VAT-inclusive price
  subtotalExcludingVAT: number // Subtotal excluding VAT (for accounting)
  total: number // Total including VAT (same as input subtotal)
}

/**
 * Get VAT rate (always 21% regardless of country)
 */
export function getVATRate(countryCode?: string): number {
  // Always return 21% VAT rate for all customers
  return VAT_RATE
}

/**
 * Calculate VAT amount from VAT-inclusive price
 * 
 * Always uses 21% VAT rate regardless of customer location.
 * Since prices already include VAT, we extract the VAT amount:
 * - VAT amount = price / (1 + VAT rate) * VAT rate
 * - Price excluding VAT = price / (1 + VAT rate)
 * 
 * Example: €100 including 21% VAT
 * - VAT amount = 100 / 1.21 * 0.21 = €17.36
 * - Price excluding VAT = 100 / 1.21 = €82.64
 */
export function calculateVAT(input: VATCalculationInput): VATResult {
  const { subtotal } = input
  const rate = VAT_RATE // Always 21%
  
  // Extract VAT from VAT-inclusive price
  const subtotalExcludingVAT = subtotal / (1 + rate)
  const amount = subtotalExcludingVAT * rate

  return {
    rate,
    amount,
    subtotalExcludingVAT,
    total: subtotal // Total is same as input (already VAT-inclusive)
  }
}

/**
 * Format VAT rate as percentage string
 */
export function formatVATRate(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`
}

/**
 * Export VAT data for quarterly filing
 * Format: CSV with order number, VAT amount, date, country
 * Note: VAT rate is always 21% regardless of country
 */
export interface VATExportRow {
  orderNumber: string
  date: string
  subtotal: number
  vatRate: number // Always 0.21 (21%)
  vatAmount: number
  country: string
}

export function formatVATExport(rows: VATExportRow[]): string {
  const headers = ['Order Number', 'Date', 'Subtotal (VAT-inclusive)', 'VAT Rate', 'VAT Amount', 'Country']
  const csvRows = [
    headers.join(','),
    ...rows.map(row => [
      row.orderNumber,
      row.date,
      row.subtotal.toFixed(2),
      '21%', // Always 21%
      row.vatAmount.toFixed(2),
      row.country
    ].join(','))
  ]
  
  return csvRows.join('\n')
}

