// Set EXPO_PUBLIC_API_URL to the deployed backend URL when hosting backend/.
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'https://localunit-api.onrender.com'
).replace(/\/+$/, '');
