import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import {
  Network,
  getUserNetworks,
  createNetwork as apiCreateNetwork,
  updateNetwork as apiUpdateNetwork,
  deleteNetwork as apiDeleteNetwork,
  CreateNetworkData,
  UpdateNetworkData,
} from '../api/network';
import { useAuth } from './AuthContext';

interface NetworkContextProps {
  networks: Network[];
  loading: boolean;
  error: string | null;
  createNetwork: (data: CreateNetworkData) => Promise<Network>;
  updateNetwork: (id: string, data: UpdateNetworkData) => Promise<Network>;
  deleteNetwork: (id: string) => Promise<void>;
  refreshNetworks: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextProps>({} as NetworkContextProps);

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadNetworks = async () => {
    if (!user) {
      setNetworks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fetchedNetworks = await getUserNetworks();
      setNetworks(fetchedNetworks);
    } catch (err: any) {
      setError(err.message || 'Failed to load networks');
      console.error('Error loading networks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNetworks();
  }, [user]);

  const createNetwork = async (data: CreateNetworkData): Promise<Network> => {
    try {
      const newNetwork = await apiCreateNetwork(data);
      setNetworks([...networks, newNetwork]);
      return newNetwork;
    } catch (err: any) {
      setError(err.message || 'Failed to create network');
      throw err;
    }
  };

  const updateNetwork = async (id: string, data: UpdateNetworkData): Promise<Network> => {
    try {
      const updatedNetwork = await apiUpdateNetwork(id, data);
      setNetworks(networks.map(network => (network._id === id ? updatedNetwork : network)));
      return updatedNetwork;
    } catch (err: any) {
      setError(err.message || 'Failed to update network');
      throw err;
    }
  };

  const deleteNetwork = async (id: string): Promise<void> => {
    try {
      await apiDeleteNetwork(id);
      setNetworks(networks.filter(network => network._id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete network');
      throw err;
    }
  };

  const refreshNetworks = async (): Promise<void> => {
    await loadNetworks();
  };

  return (
    <NetworkContext.Provider
      value={{
        networks,
        loading,
        error,
        createNetwork,
        updateNetwork,
        deleteNetwork,
        refreshNetworks,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetworks = () => useContext(NetworkContext);
