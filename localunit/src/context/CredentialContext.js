import { createContext } from 'react';

export const CredentialContext = createContext({
  credentials: null,
  setCredentials: () => {},
});
