import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configure axios
axios.defaults.withCredentials = true;

// Types
export interface RegisterData {
    username: string;
    email: string;
    password: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
}

export interface AuthResponse {
    success: boolean;
    user: User;
}

// Register user
export const register = async (data: RegisterData): Promise<User> => {
    const response = await axios.post<AuthResponse>(`${API_URL}/auth/register`, data);
    return response.data.user;
};

// Login user
export const login = async (data: LoginData): Promise<User> => {
    const response = await axios.post<AuthResponse>(`${API_URL}/auth/login`, data);
    return response.data.user;
};

// Logout user
export const logout = async (): Promise<void> => {
    await axios.post(`${API_URL}/auth/logout`);
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
    try {
        const response = await axios.get<AuthResponse>(`${API_URL}/auth/me`);
        return response.data.user;
    } catch (error) {
        return null;
    }
};