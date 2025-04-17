import axios from 'axios';

const protocol = window.location.protocol;
const hostname = window.location.hostname;
const port = window.location.port;

const API_URL = protocol + '//' + hostname + (port ? ':' + port : '') + '/api';

// Types
export interface Person {
  _id: string;
  firstName: string;
  lastName: string;
  birthday?: string;
  network: string;
  position: {
    x: number;
    y: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonData {
  firstName: string;
  lastName: string;
  birthday?: string;
  position?: {
    x: number;
    y: number;
  };
}

export interface UpdatePersonData {
  firstName?: string;
  lastName?: string;
  birthday?: string | null;
  position?: {
    x: number;
    y: number;
  };
}

// Get all people in a network
export const getPeople = async (networkId: string): Promise<Person[]> => {
  const response = await axios.get<{ success: boolean; data: Person[] }>(
    `${API_URL}/networks/${networkId}/people`
  );
  return response.data.data;
};

// Add a person to the network
export const addPerson = async (networkId: string, data: CreatePersonData): Promise<Person> => {
  const response = await axios.post<{ success: boolean; data: Person }>(
    `${API_URL}/networks/${networkId}/people`,
    data
  );
  return response.data.data;
};

// Update a person
export const updatePerson = async (
  networkId: string,
  personId: string,
  data: UpdatePersonData
): Promise<Person> => {
  const response = await axios.put<{ success: boolean; data: Person }>(
    `${API_URL}/networks/${networkId}/people/${personId}`,
    data
  );
  return response.data.data;
};

// Remove a person from the network
export const removePerson = async (networkId: string, personId: string): Promise<void> => {
  await axios.delete(`${API_URL}/networks/${networkId}/people/${personId}`);
};
