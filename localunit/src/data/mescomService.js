// Mock MESCOM API Service for LocalUnit
// Simulates server calls based on User ID and category

const mockData = {
  Domestic: {
    'demo123': {
      name: 'Ramesh Kumar',
      currentUnits: 342,
      currentBill: 1845,
      history: [
        { month: 'Apr', kWh: 320, amount: 1720 },
        { month: 'May', kWh: 380, amount: 2040 },
        { month: 'Jun', kWh: 410, amount: 2205 },
        { month: 'Jul', kWh: 435, amount: 2345 },
        { month: 'Aug', kWh: 405, amount: 2180 },
        { month: 'Sep', kWh: 360, amount: 1935 },
      ],
    },
    'user2': {
      name: 'Suresh Patel',
      currentUnits: 280,
      currentBill: 1505,
      history: [
        { month: 'Apr', kWh: 250, amount: 1340 },
        { month: 'May', kWh: 290, amount: 1560 },
        { month: 'Jun', kWh: 310, amount: 1670 },
        { month: 'Jul', kWh: 330, amount: 1770 },
        { month: 'Aug', kWh: 300, amount: 1610 },
        { month: 'Sep', kWh: 270, amount: 1450 },
      ],
    },
  },
  Commercial: {
    'demo456': {
      name: 'ABC Enterprises',
      currentUnits: 1250,
      currentBill: 8920,
      history: [
        { month: 'Apr', kWh: 1100, amount: 7800 },
        { month: 'May', kWh: 1300, amount: 9200 },
        { month: 'Jun', kWh: 1450, amount: 10250 },
        { month: 'Jul', kWh: 1520, amount: 10750 },
        { month: 'Aug', kWh: 1380, amount: 9750 },
        { month: 'Sep', kWh: 1200, amount: 8500 },
      ],
    },
    'user3': {
      name: 'XYZ Constructions',
      currentUnits: 950,
      currentBill: 6800,
      history: [
        { month: 'Apr', kWh: 880, amount: 6200 },
        { month: 'May', kWh: 950, amount: 6700 },
        { month: 'Jun', kWh: 1020, amount: 7200 },
        { month: 'Jul', kWh: 1100, amount: 7800 },
        { month: 'Aug', kWh: 970, amount: 6900 },
        { month: 'Sep', kWh: 850, amount: 6000 },
      ],
    },
  },
};

// Simulate API delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchMESCOMData = async (userId, category) => {
  await delay(1000); // Simulate network latency

  const categoryData = mockData[category];
  if (!categoryData) {
    throw new Error('Invalid category');
  }

  const userData = categoryData[userId];
  if (!userData) {
    throw new Error('User not found for this category');
  }

  return {
    name: userData.name,
    currentUnits: userData.currentUnits,
    currentBill: userData.currentBill,
    history: userData.history,
  };
};