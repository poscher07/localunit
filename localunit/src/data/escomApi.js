import { API_BASE_URL } from '../config/api';

export class EscomApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'EscomApiError';
    this.status = status;
    this.code = code;
  }
}

export async function fetchLiveBill(credentials) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/fetch-bill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
  } catch {
    throw new Error('Could not reach the LocalUnit bill service. Check your connection and API deployment.');
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error('The LocalUnit bill service returned an invalid response.');
  }

  if (!response.ok) {
    throw new EscomApiError(
      result && typeof result.message === 'string'
        ? result.message
        : 'The live bill could not be fetched.',
      response.status,
      result && result.code,
    );
  }
  return result;
}
