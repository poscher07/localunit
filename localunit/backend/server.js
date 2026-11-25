require('dotenv').config();

const cors = require('cors');
const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { fetchEscomBill, PortalError } = require('./scrapers/escomScraper');

const app = express();
const port = Number(process.env.PORT) || 3000;
const fetchBillLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 'RATE_LIMITED',
    message: 'Too many bill requests. Try again later.',
  },
});

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.post('/api/fetch-bill', fetchBillLimiter, async (request, response) => {
  const { escom, category, userId, password } = request.body || {};
  if (
    typeof escom !== 'string' ||
    typeof category !== 'string' ||
    typeof userId !== 'string' ||
    typeof password !== 'string' ||
    !userId.trim() ||
    !password
  ) {
    return response.status(400).json({
      code: 'INVALID_REQUEST',
      message: 'Provide an ESCOM, category, User ID, and password.',
    });
  }

  try {
    const bill = await fetchEscomBill({
      escom,
      category,
      userId: userId.trim(),
      password,
    });
    return response.json(bill);
  } catch (error) {
    if (error instanceof PortalError && error.code === 'UNREGISTERED_OR_INVALID') {
      return response.status(401).json({
        code: 'UNREGISTERED_OR_INVALID',
        message: 'Account not found or invalid password on official ESCOM portal.',
      });
    }
    if (error instanceof PortalError && error.code === 'CAPTCHA_REQUIRED') {
      return response.status(503).json({
        code: 'CAPTCHA_REQUIRED',
        message: 'Complete the CAPTCHA in the official ESCOM portal to sync your bill.',
      });
    }

    process.stderr.write(
      `Bill fetch unavailable: ${error instanceof PortalError ? error.code : 'unexpected_error'}\n`,
    );
    return response.status(503).json({
      code: 'PORTAL_UNAVAILABLE',
      message: 'Official ESCOM server is temporarily unreachable or requires CAPTCHA verification.',
    });
  }
});

app.listen(port, () => {
  process.stdout.write(`LocalUnit API listening on port ${port}\n`);
});
