import axios from 'axios';
import { RELATIONSHIP_TYPES } from '../types/RelationShipTypes';
import { Relationship } from '../interfaces/IRelationship';

const protocol = window.location.protocol;
const hostname = window.location.hostname;
const port = window.location.port;

const API_URL = protocol + '//' + hostname + (port ? ':' + port : '') + '/api';

export interface CreateRelationshipData {
  source: string;
  target: string;
  type: RELATIONSHIP_TYPES;
  customType?: string;
}

export interface UpdateRelationshipData {
  type?: RELATIONSHIP_TYPES;
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
export const removeRelationship = async (
  networkId: string,
  relationshipId: string
): Promise<void> => {
  await axios.delete(`${API_URL}/networks/${networkId}/relationships/${relationshipId}`);
};
