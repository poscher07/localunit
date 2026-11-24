import AsyncStorage from '@react-native-async-storage/async-storage';

function parseAccounts(value) {
  if (!value) {
    return [];
  }
  const accounts = JSON.parse(value);
  if (!Array.isArray(accounts)) {
    throw new Error('Saved account data is invalid. Please register again.');
  }
  return accounts;
}

export async function getAccountsForDivision(divisionCode) {
  const storageKey = `users:${divisionCode}`;
  const scopedAccounts = parseAccounts(await AsyncStorage.getItem(storageKey));
  if (divisionCode !== 'MESCOM') {
    return scopedAccounts;
  }

  const legacyAccounts = parseAccounts(await AsyncStorage.getItem('users'));
  const accountIds = new Set(
    scopedAccounts
      .filter((account) => typeof account?.userId === 'string')
      .map((account) => account.userId.trim().toLowerCase()),
  );
  const migratedAccounts = legacyAccounts
    .filter(
      (account) =>
        typeof account?.userId === 'string' &&
        (!account.divisionCode || account.divisionCode === 'MESCOM') &&
        !accountIds.has(account.userId.trim().toLowerCase()),
    )
    .map((account) => ({ ...account, divisionCode: 'MESCOM' }));

  if (migratedAccounts.length > 0) {
    const accounts = [...scopedAccounts, ...migratedAccounts];
    await AsyncStorage.setItem(storageKey, JSON.stringify(accounts));
    return accounts;
  }
  return scopedAccounts;
}

export async function saveAccountsForDivision(divisionCode, accounts) {
  await AsyncStorage.setItem(`users:${divisionCode}`, JSON.stringify(accounts));
}
