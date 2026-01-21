/**
 * Shipping calculation logic for FashionVoid
 * 
 * Shipping Rules:
 * - EU (except footwear): FREE
 * - EU Footwear: €10
 * - US/International Clothing only: €30 (2-7 business days)
 * - US/International Footwear only: €44.03 (2-7 business days)
 * - US/International Clothing + Footwear: €55 (2-7 business days)
 * - Other countries: Same rates as US
 */

export interface ShippingCalculationInput {
  items: Array<{
    category: string // 'tops', 'bottoms', 'footwear', 'accessories'
    quantity: number
  }>
  zone: string // 'EU' | 'US' | 'CA' | 'AU' | 'ASIA'
  countryName?: string
}

export interface ShippingResult {
  cost: number
  method: string
  estimatedDays?: string
}

// EU countries list
const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
]

/**
 * Check if a country is in the EU
 */
export function isEUCountry(countryCode: string): boolean {
  return EU_COUNTRIES.includes(countryCode.toUpperCase())
}

/**
 * Check if cart contains any footwear items
 */
export function hasFootwear(items: ShippingCalculationInput['items']): boolean {
  return items.some(item => item.category.toLowerCase() === 'footwear')
}

/**
 * Check if cart contains any clothing items (tops, bottoms, accessories)
 */
export function hasClothing(items: ShippingCalculationInput['items']): boolean {
  const clothingCategories = ['tops', 'bottoms', 'accessories']
  return items.some(item => clothingCategories.includes(item.category.toLowerCase()))
}

/**
 * Check if cart contains both clothing and footwear
 */
export function hasBothClothingAndFootwear(items: ShippingCalculationInput['items']): boolean {
  return hasClothing(items) && hasFootwear(items)
}

/**
 * Calculate shipping cost based on destination and cart contents
 */
export function calculateShipping(input: ShippingCalculationInput): ShippingResult {
  const { items, zone } = input
  const hasFootwearItems = hasFootwear(items)
  const hasClothingItems = hasClothing(items)
  const clothingQty = items
    .filter((i) => ['tops', 'bottoms', 'accessories'].includes(i.category.toLowerCase()))
    .reduce((sum, i) => sum + i.quantity, 0)

  const z = zone.toUpperCase()

  // EU shipping rules
  if (z === 'EU') {
    if (hasFootwearItems) {
      return {
        cost: 10.0,
        method: 'EU Shipping',
        estimatedDays: '2-7 business days',
      }
    }
    return {
      cost: 0.0,
      method: 'EU Shipping',
      estimatedDays: '2-7 business days',
    }
  }

  // US shipping rules (existing)
  if (z === 'US') {
    if (hasBothClothingAndFootwear(items)) {
      return { cost: 55.0, method: 'US Shipping', estimatedDays: '2-7 business days' }
    } else if (hasFootwearItems) {
      return { cost: 44.03, method: 'US Shipping', estimatedDays: '2-7 business days' }
    } else {
      return { cost: 30.0, method: 'US Shipping', estimatedDays: '2-7 business days' }
    }
  }

  // Canada / Australia / Asia rules (same table)
  if (z === 'CA' || z === 'AU' || z === 'ASIA') {
    // Clothing only
    if (hasClothingItems && !hasFootwearItems) {
      if (clothingQty >= 3) {
        return { cost: 63.0, method: `${z} Shipping`, estimatedDays: '5-14 business days' }
      }
      return { cost: 53.0, method: `${z} Shipping`, estimatedDays: '5-14 business days' }
    }
    // Footwear only
    if (hasFootwearItems && !hasClothingItems) {
      return { cost: 63.0, method: `${z} Shipping`, estimatedDays: '5-14 business days' }
    }
    // Both clothing and footwear
    if (hasBothClothingAndFootwear(items)) {
      return { cost: 75.0, method: `${z} Shipping`, estimatedDays: '5-14 business days' }
    }
  }

  // Fallback: treat as US rates
  if (hasBothClothingAndFootwear(items)) {
    return { cost: 55.0, method: 'International Shipping', estimatedDays: '5-14 business days' }
  } else if (hasFootwearItems) {
    return { cost: 44.03, method: 'International Shipping', estimatedDays: '5-14 business days' }
  }
  return { cost: 30.0, method: 'International Shipping', estimatedDays: '5-14 business days' }
}

