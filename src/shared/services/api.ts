import axios, { type AxiosInstance } from 'axios';
import { getIdToken } from '@src/shared/services/firebase/auth';
import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.cloudFunctionsUrl ?? '';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await getIdToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ??
      error.message ??
      'Error de red desconocido.';
    throw new Error(message);
  }
);

export { api };
