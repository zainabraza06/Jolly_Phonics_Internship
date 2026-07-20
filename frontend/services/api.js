// API service for Next.js - connects to FastAPI backend
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = BACKEND_URL;
  }

  async healthCheck() {
    const response = await fetch(`${this.baseURL}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
  }

  async testConnection() {
    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  }

  async gradePronunciation(videoFile, phoneme) {
    const formData = new FormData();
    formData.append('file', videoFile);
    formData.append('user_phenome', phoneme);

    const response = await fetch(`${this.baseURL}/predict/`, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP error: ${response.status}`);
    }
    return response.json();
  }
}

const apiService = new ApiService();
export default apiService;
