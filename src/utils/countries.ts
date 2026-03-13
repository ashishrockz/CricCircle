export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  dialCode: string;
  flag: string;
}

/** Popular cricket-playing and major countries first, then alphabetical */
export const COUNTRIES: Country[] = [
  {code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳'},
  {code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸'},
  {code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧'},
  {code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺'},
  {code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰'},
  {code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩'},
  {code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰'},
  {code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦'},
  {code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿'},
  {code: 'WI', name: 'West Indies', dialCode: '+1', flag: '🏝️'},
  {code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪'},
  {code: 'AF', name: 'Afghanistan', dialCode: '+93', flag: '🇦🇫'},
  {code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦'},
  {code: 'ZW', name: 'Zimbabwe', dialCode: '+263', flag: '🇿🇼'},
  {code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪'},
  {code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵'},
  {code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪'},
  {code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾'},
  {code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬'},
  {code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦'},
  {code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦'},
  {code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼'},
  {code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲'},
  {code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭'},
  {code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪'},
  {code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷'},
  {code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹'},
  {code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸'},
  {code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷'},
  {code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵'},
  {code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷'},
  {code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳'},
  {code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺'},
  {code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽'},
  {code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬'},
  {code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬'},
  {code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭'},
  {code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭'},
  {code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩'},
  {code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷'},
];

/** Find country by ISO code */
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}

/** Default country (India) */
export const DEFAULT_COUNTRY = COUNTRIES[0];
