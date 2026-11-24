const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const categorySettings = {
  Domestic: {
    baseUnits: 260,
    tariff: 5.4,
    demoOwner: 'Ramesh Kumar',
  },
  Commercial: {
    baseUnits: 1120,
    tariff: 7.1,
    demoOwner: 'LocalUnit Demo Business',
  },
};

function createHistory(userId, category) {
  const settings = categorySettings[category];
  const seed = Array.from(userId).reduce(
    (total, character) => total + character.charCodeAt(0),
    category.length * 17,
  );
  const now = new Date();

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
      billAmount: Math.round(kWh * settings.tariff),
    };
  });
}

export async function fetchMESCOMData(userId, category, ownerName) {
  if (typeof userId !== 'string' || !userId.trim()) {
    throw new Error('A valid MESCOM User ID is required.');
  }
  if (!Object.prototype.hasOwnProperty.call(categorySettings, category)) {
    throw new Error('Select a valid Domestic or Commercial category.');
  }

  await delay(1000);

  const history = createHistory(userId.trim(), category);
  const demoOwner =
    userId.trim().toLowerCase() === 'demo123'
      ? categorySettings[category].demoOwner
      : `MESCOM Account ${userId.trim()}`;

  return {
    ownerName: ownerName?.trim() || demoOwner,
    currentUnits: history[history.length - 1].kWh,
    currentBill: history[history.length - 1].billAmount,
    history,
  };
}