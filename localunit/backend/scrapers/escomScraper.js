const { chromium } = require('playwright');
const cheerio = require('cheerio');

const PORTALS = {
  BESCOM: {
    name: 'Bangalore Electricity Supply Company',
    loginUrl: 'https://bescom.trm.ieasybill.com:444/',
    origin: 'https://bescom.trm.ieasybill.com:444',
    userSelector: '#txtLoginName',
    passwordSelector: '#txtPassword',
    submitSelector: '#btnLogin',
  },
  MESCOM: {
    name: 'Mangalore Electricity Supply Company',
    loginUrl: 'https://mescom.org.in/mescom/auth/login',
    origin: 'https://mescom.org.in',
    userSelector: 'input[name="userId"]',
    passwordSelector: 'input[name="password"]',
    submitSelector: 'button[type="submit"]',
  },
  HESCOM: {
    name: 'Hubli Electricity Supply Company',
    loginUrl: 'https://www.hescom.co.in/hescom/auth/login',
    origin: 'https://www.hescom.co.in',
    userSelector: 'input[name="userId"]',
    passwordSelector: 'input[name="password"]',
    submitSelector: 'button[type="submit"]',
  },
  GESCOM: {
    name: 'Gulbarga Electricity Supply Company',
    loginUrl: 'https://gescomglb.org/gescom/login',
    origin: 'https://gescomglb.org',
    userSelector: 'input[name="userId"]',
    passwordSelector: 'input[name="password"]',
    submitSelector: 'button[type="submit"]',
  },
  CESC: {
    name: 'Chamundeshwari Electricity Supply Corporation',
    loginUrl: 'https://wss.cescom.ieasybill.com/',
    origin: 'https://wss.cescom.ieasybill.com',
    userSelector: '#txtLoginName',
    passwordSelector: '#txtPassword',
    submitSelector: '#btnLogin',
  },
};

const NAVIGATION_TIMEOUT_MS = 20000;
const ACTION_TIMEOUT_MS = 10000;

class PortalError extends Error {
  constructor(code) {
    super(code);
    this.name = 'PortalError';
    this.code = code;
  }
}

function isVerificationChallenge(text) {
  return /captcha|recaptcha|hcaptcha|verify you are human|one[\s-]?time password|\bOTP\b/i.test(text);
}

function isCaptchaChallenge(text) {
  return /captcha|recaptcha|hcaptcha|verify you are human/i.test(text);
}

function normalizeLabel(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findLabelValue($, labels) {
  const normalizedLabels = labels.map(normalizeLabel);
  let found = '';

  $('tr').each((_index, row) => {
    const cells = $(row).find('th, td').toArray();
    for (let cellIndex = 0; cellIndex < cells.length - 1; cellIndex += 1) {
      const label = normalizeLabel($(cells[cellIndex]).text());
      if (normalizedLabels.some((candidate) => label === candidate || label.startsWith(candidate))) {
        found = $(cells[cellIndex + 1]).text().trim();
        return false;
      }
    }
    return undefined;
  });
  if (found) {
    return found;
  }

  $('label').each((_index, element) => {
    const label = normalizeLabel($(element).text());
    if (normalizedLabels.some((candidate) => label === candidate || label.startsWith(candidate))) {
      const associatedId = $(element).attr('for');
      const associatedValue = associatedId ? $(`#${associatedId}`).val() : '';
      found = String(associatedValue || $(element).next().text() || '').trim();
      return false;
    }
    return undefined;
  });
  return found;
}

function parseNumericValue(value) {
  if (!value) {
    return null;
  }
  const match = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseHistory($) {
  const history = [];
  $('table').each((_tableIndex, table) => {
    const rows = $(table).find('tr').toArray();
    if (rows.length < 2) {
      return;
    }
    const headings = $(rows[0])
      .find('th, td')
      .toArray()
      .map((cell) => normalizeLabel($(cell).text()));
    const monthIndex = headings.findIndex((value) => /month|period|cycle/.test(value));
    const unitsIndex = headings.findIndex((value) => /unit|kwh|consumption|consumed/.test(value));
    const amountIndex = headings.findIndex((value) => /amount|bill|payable/.test(value));
    if (monthIndex < 0 || unitsIndex < 0 || amountIndex < 0) {
      return;
    }

    for (const row of rows.slice(1)) {
      const cells = $(row).find('th, td').toArray();
      const month = $(cells[monthIndex]).text().trim();
      const units = parseNumericValue($(cells[unitsIndex]).text());
      const amount = parseNumericValue($(cells[amountIndex]).text());
      if (month && units !== null && amount !== null) {
        history.push({ month, units, amount });
      }
    }
    return false;
  });
  return history;
}

function extractBill(html, escom, category) {
  const $ = cheerio.load(html);
  const ownerName = findLabelValue($, ['consumer name', 'owner name', 'registered name']);
  const accountId = findLabelValue($, ['account id', 'rr number', 'rr no', 'consumer number']);
  const unitsConsumed = parseNumericValue(
    findLabelValue($, ['units consumed', 'current month units', 'total units', 'energy consumed']),
  );
  const amountDue = parseNumericValue(
    findLabelValue($, ['amount due', 'net payable', 'total payable', 'bill amount']),
  );
  const dueDate = findLabelValue($, ['due date', 'payment due date']);
  const billMonth = findLabelValue($, ['bill month', 'billing month', 'billing cycle']);

  if (
    !ownerName ||
    !accountId ||
    !/^\d{10}$/.test(accountId.replace(/\s/g, '')) ||
    unitsConsumed === null ||
    amountDue === null ||
    !dueDate ||
    !billMonth
  ) {
    throw new PortalError('PORTAL_UNAVAILABLE');
  }

  return {
    ownerName,
    accountId: accountId.replace(/\s/g, ''),
    escom: { code: escom, name: PORTALS[escom].name },
    category,
    unitsConsumed,
    amountDue,
    dueDate,
    billMonth,
    history: parseHistory($),
    lastSynced: new Date().toISOString(),
  };
}

async function loginAndReadBill(page, escom, category, userId, password) {
  const portal = PORTALS[escom];
  let response;
  try {
    response = await page.goto(portal.loginUrl, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT_MS,
    });
  } catch {
    throw new PortalError('PORTAL_UNAVAILABLE');
  }

  if (!response || response.status() >= 400 || new URL(page.url()).origin !== portal.origin) {
    throw new PortalError('PORTAL_UNAVAILABLE');
  }

  let pageText = await page.locator('body').innerText();
  const captchaFields = page.locator(
    'input[id*="captcha" i], input[name*="captcha" i], input[placeholder*="captcha" i], img[src*="captcha" i]',
  );
  if ((await captchaFields.count()) > 0 || isCaptchaChallenge(pageText)) {
    throw new PortalError('CAPTCHA_REQUIRED');
  }
  if (isVerificationChallenge(pageText)) {
    throw new PortalError('PORTAL_UNAVAILABLE');
  }

  const userField = page.locator(portal.userSelector).first();
  const passwordField = page.locator(portal.passwordSelector).first();
  const submitButton = page.locator(portal.submitSelector).first();
  try {
    await userField.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT_MS });
    await passwordField.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT_MS });
    await submitButton.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT_MS });
  } catch {
    throw new PortalError('PORTAL_UNAVAILABLE');
  }

  const formAction = await passwordField.evaluate((element) => element.form?.action || location.href);
  if (new URL(formAction, page.url()).origin !== portal.origin) {
    throw new PortalError('PORTAL_UNAVAILABLE');
  }

  try {
    await userField.fill(userId);
    await passwordField.fill(password);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: ACTION_TIMEOUT_MS }).catch(() => null),
      submitButton.click(),
    ]);
  } catch {
    throw new PortalError('PORTAL_UNAVAILABLE');
  }

  await page.waitForTimeout(500);
  if (new URL(page.url()).origin !== portal.origin) {
    throw new PortalError('PORTAL_UNAVAILABLE');
  }
  pageText = await page.locator('body').innerText();
  if (isCaptchaChallenge(pageText)) {
    throw new PortalError('CAPTCHA_REQUIRED');
  }
  if (isVerificationChallenge(pageText)) {
    throw new PortalError('PORTAL_UNAVAILABLE');
  }
  if (/invalid (user|login|account|password)|incorrect password|wrong password|account not found|login failed|authentication failed/i.test(pageText)) {
    throw new PortalError('UNREGISTERED_OR_INVALID');
  }
  if ((await page.locator('input[type="password"]:visible').count()) > 0) {
    throw new PortalError('UNREGISTERED_OR_INVALID');
  }

  return extractBill(await page.content(), escom, category);
}

async function fetchEscomBill({ escom, category, userId, password }) {
  const portal = PORTALS[escom];
  if (!portal || !['Domestic', 'Commercial'].includes(category)) {
    throw new PortalError('PORTAL_UNAVAILABLE');
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      acceptDownloads: false,
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(ACTION_TIMEOUT_MS);
    return await loginAndReadBill(page, escom, category, userId, password);
  } catch (error) {
    if (error instanceof PortalError) {
      throw error;
    }
    process.stderr.write('Portal automation failed: unexpected_error\n');
    throw new PortalError('PORTAL_UNAVAILABLE');
  } finally {
    if (browser) {
      await browser.close().catch(() => {
        process.stderr.write('Browser cleanup failed\n');
      });
    }
  }
}

module.exports = {
  fetchEscomBill,
  PortalError,
};
