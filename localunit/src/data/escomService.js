import { getEscomDivision } from './escomDivisions';

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const categorySettings = {
  Domestic: {
    baseUnits: 260,
    baseTariff: 5.4,
    demoOwner: 'Ramesh Kumar',
  },
  Commercial: {
    baseUnits: 1120,
    baseTariff: 7.1,
    demoOwner: 'LocalUnit Demo Business',
  },
};

function createHistory(userId, category, division) {
  const settings = categorySettings[category];
  const seed = Array.from(userId).reduce(
    (total, character) => total + character.charCodeAt(0),
    category.length * 17 + division.code.length * 11,
  );
  const now = new Date();
  const perUnitRate = settings.baseTariff * division.tariffMultiplier;

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const variation = ((seed + index * 37) % 161) - 80;
    const seasonalAdjustment = Math.round(Math.sin(index * 1.1) * 28);
    const kWh = Math.max(
      80,
      Math.round(settings.baseUnits + variation + seasonalAdjustment),
    );

    return {
      month: date.toLocaleString('en-US', { month: 'short' }),
      kWh,
      billAmount: Math.round(kWh * perUnitRate),
    };
  });
}

export async function fetchESCOMData(userId, category, divisionCode, ownerName) {
  if (typeof userId !== 'string' || !userId.trim()) {
    throw new Error('A valid ESCOM User ID is required.');
  }
  if (!Object.prototype.hasOwnProperty.call(categorySettings, category)) {
    throw new Error('Select a valid Domestic or Commercial category.');
  }
  const division = getEscomDivision(divisionCode);
  if (!division) {
    throw new Error('Select a valid Karnataka ESCOM division.');
  }

  await delay(1000);

  const history = createHistory(userId.trim(), category, division);
  const demoOwner =
    userId.trim().toLowerCase() === 'demo123'
      ? categorySettings[category].demoOwner
      : `${division.code} Account ${userId.trim()}`;

  return {
    ownerName: ownerName?.trim() || demoOwner,
    division: {
      code: division.code,
      name: division.name,
      headquarters: division.headquarters,
      districts: division.districts,
      accentColor: division.accentColor,
    },
    currentUnits: history[history.length - 1].kWh,
    currentBill: history[history.length - 1].billAmount,
    history,
  };
}
