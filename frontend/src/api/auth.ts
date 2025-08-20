import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

export const authAPI = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response: any = await axios.post(`${API_URL}/login`, {
      email,
      password
    });
    return response.data.data;
  },
};