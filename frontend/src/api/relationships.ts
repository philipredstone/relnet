import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Types
export interface Relationship {
    _id: string;
    source: string;
    target: string;
    type: 'freund' | 'partner' | 'familie' | 'arbeitskolleg' | 'custom';
    customType?: string;
    network: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateRelationshipData {
    source: string;
    target: string;
    type: 'freund' | 'partner' | 'familie' | 'arbeitskolleg' | 'custom';
    customType?: string;
}

export interface UpdateRelationshipData {
    type?: 'freund' | 'partner' | 'familie' | 'arbeitskolleg' | 'custom';
    customType?: string;
}

// Get all relationships in a network
export const getRelationships = async (networkId: string): Promise<Relationship[]> => {
    const response = await axios.get<{ success: boolean; data: Relationship[] }>(
        `${API_URL}/networks/${networkId}/relationships`
    );
    return response.data.data;
};

// Add a relationship to the network
export const addRelationship = async (
    networkId: string,
    data: CreateRelationshipData
): Promise<Relationship> => {
    const response = await axios.post<{ success: boolean; data: Relationship }>(
        `${API_URL}/networks/${networkId}/relationships`,
        data
    );
    return response.data.data;
};

// Update a relationship
export const updateRelationship = async (
    networkId: string,
    relationshipId: string,
    data: UpdateRelationshipData
): Promise<Relationship> => {
    const response = await axios.put<{ success: boolean; data: Relationship }>(
        `${API_URL}/networks/${networkId}/relationships/${relationshipId}`,
        data
    );
    return response.data.data;
};

// Remove a relationship
export const removeRelationship = async (networkId: string, relationshipId: string): Promise<void> => {
    await axios.delete(`${API_URL}/networks/${networkId}/relationships/${relationshipId}`);
};