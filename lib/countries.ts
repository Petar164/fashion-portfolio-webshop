/**
 * Country name to country code mapping
 * Used for shipping and VAT calculations
 */

export const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  'Netherlands': 'NL',
  'Belgium': 'BE',
  'Germany': 'DE',
  'France': 'FR',
  'United Kingdom': 'GB',
  'United States': 'US',
  'Italy': 'IT',
  'Spain': 'ES',
  'Austria': 'AT',
  'Poland': 'PL',
  'Sweden': 'SE',
  'Denmark': 'DK',
  'Finland': 'FI',
  'Ireland': 'IE',
  'Portugal': 'PT',
  'Greece': 'GR',
  'Czech Republic': 'CZ',
  'Hungary': 'HU',
  'Romania': 'RO',
  'Slovakia': 'SK',
  'Slovenia': 'SI',
  'Croatia': 'HR',
  'Bulgaria': 'BG',
  'Cyprus': 'CY',
  'Estonia': 'EE',
  'Latvia': 'LV',
  'Lithuania': 'LT',
  'Luxembourg': 'LU',
  'Malta': 'MT',
  'Other': 'OTHER',
}

/**
 * Convert country name to country code
 * Returns country code or 'OTHER' if not found
 */
export function getCountryCode(countryName: string): string {
  return COUNTRY_NAME_TO_CODE[countryName] || 'OTHER'
}

