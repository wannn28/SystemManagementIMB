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

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: number;
  email: string;
  status: string;
}

export const authAPI = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response: any = await axios.post(`${API_URL}/login`, {
      email,
      password
    });
    return response.data;
  },
  register: async (payload: RegisterRequest): Promise<RegisterResponse> => {
    const response: any = await axios.post(`${API_URL}/register`, payload);
    return response.data.data;
  },
  forgotPassword: async (email: string): Promise<{ reset_token?: string; message: string }> => {
    const response: any = await axios.post(`${API_URL}/forgot-password`, { email });
    return response.data.data;
  },
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response: any = await axios.post(`${API_URL}/reset-password`, { token, new_password: newPassword });
    return response.data.data;
  },
};