export const ESCOM_DIVISIONS = [
  {
    code: 'BESCOM',
    name: 'Bangalore Electricity Supply Company',
    headquarters: 'Bengaluru',
    districts: [
      'Bengaluru Urban',
      'Bengaluru Rural',
      'Kolar',
      'Tumakuru',
      'Ramanagara',
      'Chikkaballapur',
      'Chitradurga',
      'Davanagere',
    ],
    accentColor: '#1684c4',
    tariffMultiplier: 1.08,
  },
  {
    code: 'MESCOM',
    name: 'Mangalore Electricity Supply Company',
    headquarters: 'Mangaluru',
    districts: ['Dakshina Kannada', 'Udupi', 'Chikkamagaluru', 'Shivamogga'],
    accentColor: '#0c9b9b',
    tariffMultiplier: 1.04,
  },
  {
    code: 'HESCOM',
    name: 'Hubli Electricity Supply Company',
    headquarters: 'Hubballi',
    districts: [
      'Dharwad',
      'Belagavi',
      'Vijayapura',
      'Bagalkot',
      'Uttara Kannada',
      'Haveri',
      'Gadag',
    ],
    accentColor: '#8055c7',
    tariffMultiplier: 0.98,
  },
  {
    code: 'GESCOM',
    name: 'Gulbarga Electricity Supply Company',
    headquarters: 'Kalaburagi',
    districts: [
      'Kalaburagi',
      'Bidar',
      'Raichur',
      'Koppal',
      'Ballari',
      'Yadgir',
      'Vijayanagara',
    ],
    accentColor: '#d18126',
    tariffMultiplier: 0.94,
  },
  {
    code: 'CESC',
    name: 'Chamundeshwari Electricity Supply Corporation',
    headquarters: 'Mysuru',
    districts: ['Mysuru', 'Mandya', 'Hassan', 'Chamarajanagar', 'Kodagu'],
    accentColor: '#c44d75',
    tariffMultiplier: 1,
  },
];

export function getEscomDivision(code) {
  return ESCOM_DIVISIONS.find((division) => division.code === code);
}
