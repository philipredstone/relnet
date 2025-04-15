import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Types
export interface Network {
    _id: string;
    name: string;
    description?: string;
    owner: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateNetworkData {
    name: string;
    description?: string;
    isPublic?: boolean;
}

export interface UpdateNetworkData {
    name?: string;
    description?: string;
    isPublic?: boolean;
}

// Get all networks for current user
export const getUserNetworks = async (): Promise<Network[]> => {
    const response = await axios.get<{ success: boolean; data: Network[] }>(`${API_URL}/networks`);
    return response.data.data;
};

// Create a new network
export const createNetwork = async (data: CreateNetworkData): Promise<Network> => {
    const response = await axios.post<{ success: boolean; data: Network }>(`${API_URL}/networks`, data);
    return response.data.data;
};

// Get a specific network
export const getNetwork = async (id: string): Promise<Network> => {
    const response = await axios.get<{ success: boolean; data: Network }>(`${API_URL}/networks/${id}`);
    return response.data.data;
};

// Update a network
export const updateNetwork = async (id: string, data: UpdateNetworkData): Promise<Network> => {
    const response = await axios.put<{ success: boolean; data: Network }>(`${API_URL}/networks/${id}`, data);
    return response.data.data;
};

// Delete a network
export const deleteNetwork = async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/networks/${id}`);
};