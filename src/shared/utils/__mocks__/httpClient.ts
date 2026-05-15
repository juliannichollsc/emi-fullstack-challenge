// Automatic Jest mock for httpClient — sits next to the real file.
// Jest picks this up when jest.mock('@shared/utils/httpClient') is called,
// OR when moduleNameMapper routes to this file.
import axios from 'axios';

export const httpClient = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});
