import axios from 'axios';

// Use localhost for local dev, and relative /api for production Cloud Run
const API_URL = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

const api = axios.create({
  baseURL: API_URL,
});

export default api;
