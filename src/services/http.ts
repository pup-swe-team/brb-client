import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK !== 'false';
export const http = axios.create({ baseURL: process.env.EXPO_PUBLIC_API_URL, timeout: 15000 });
export const TOKEN_KEY = 'brb_access_token';
http.interceptors.request.use(async (cfg) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
// TODO: add refresh-token handling once the backend JWT flow is confirmed.
