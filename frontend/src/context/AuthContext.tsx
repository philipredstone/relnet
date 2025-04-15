import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User, getCurrentUser, login as apiLogin, register as apiRegister, logout as apiLogout, LoginData, RegisterData } from '../api/auth';

interface AuthContextProps {
    user: User | null;
    loading: boolean;
    login: (data: LoginData) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const currentUser = await getCurrentUser();
                setUser(currentUser);
            } catch (error) {
                console.error('Error loading user:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = async (data: LoginData) => {
        try {
            const loggedInUser = await apiLogin(data);
            setUser(loggedInUser);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const register = async (data: RegisterData) => {
        try {
            const newUser = await apiRegister(data);
            setUser(newUser);
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await apiLogout();
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);