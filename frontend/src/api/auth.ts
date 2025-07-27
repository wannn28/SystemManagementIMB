import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await axios.post(`${API_URL}/login`, {
      email,
      password
    });
    return response.data;
  },
};