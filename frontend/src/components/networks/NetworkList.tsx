import React, { useState } from 'react';
import { useNetworks } from '../../context/NetworkContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NetworkList: React.FC = () => {
  const { networks, loading, error, createNetwork, deleteNetwork } = useNetworks();
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNetworkName, setNewNetworkName] = useState('');
  const [newNetworkDescription, setNewNetworkDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateNetwork = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newNetworkName.trim()) {
      setFormError('Network name is required');
      return;
    }

    setCreateLoading(true);

    try {
      const network = await createNetwork({
        name: newNetworkName.trim(),
        description: newNetworkDescription.trim() || undefined,
        isPublic,
      });

      // Reset form
      setNewNetworkName('');
      setNewNetworkDescription('');
      setIsPublic(false);
      setShowCreateForm(false);

      // Navigate to the new network
      navigate(`/networks/${network._id}`);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create network');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteNetwork = async (id: string) => {
    if (
      window.confirm('Are you sure you want to delete this network? This action cannot be undone.')
    ) {
      try {
        await deleteNetwork(id);
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete network');
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading networks...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Networks</h1>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create New Network'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Create Network Form */}
      {showCreateForm && (
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Network</h2>

          {formError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateNetwork}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Network Name *
              </label>
              <input
                id="name"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded"
                value={newNetworkName}
                onChange={e => setNewNetworkName(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                Description (Optional)
              </label>
              <textarea
                id="description"
                className="w-full px-3 py-2 border border-gray-300 rounded"
                value={newNetworkDescription}
                onChange={e => setNewNetworkDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={isPublic}
                  onChange={e => setIsPublic(e.target.checked)}
                />
                <span className="text-gray-700 text-sm font-bold">Make this network public</span>
              </label>
            </div>

            <button
              type="submit"
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              disabled={createLoading}
            >
              {createLoading ? 'Creating...' : 'Create Network'}
            </button>
          </form>
        </div>
      )}

      {/* Networks List */}
      {networks.length === 0 ? (
        <div className="bg-white p-8 rounded-lg text-center">
          <p className="text-gray-600 mb-4">You don't have any networks yet.</p>
          {!showCreateForm && (
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => setShowCreateForm(true)}
            >
              Create Your First Network
            </button>
          )}
        </div>
      ) : (
        <>
          {/* My Networks Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">My Networks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {networks
                .filter(network => {
                  if (!user) return false;
                  const ownerId =
                    typeof network.owner === 'string' ? network.owner : network.owner._id;
                  return ownerId === user.id;
                })
                .map(network => (
                  <div key={network._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-4">
                      <h2 className="text-xl font-bold mb-2">{network.name}</h2>
                      {network.description && (
                        <p className="text-gray-600 mb-4">{network.description}</p>
                      )}
                      <div className="flex items-center mb-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${network.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                        >
                          {network.isPublic ? 'Public' : 'Private'}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          Created: {new Date(network.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          className="flex-1 bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"
                          onClick={() => navigate(`/networks/${network._id}`)}
                        >
                          View
                        </button>
                        <button
                          className="flex-1 bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded"
                          onClick={() => handleDeleteNetwork(network._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            {networks.filter(network => {
              if (!user) return false;
              const ownerId = typeof network.owner === 'string' ? network.owner : network.owner._id;
              return ownerId === user.id;
            }).length === 0 && (
              <p className="text-gray-600 mb-4">You haven't created any networks yet.</p>
            )}
          </div>

          {/* Public Networks Section */}
          {networks.some(network => {
            if (!user) return false;
            const ownerId = typeof network.owner === 'string' ? network.owner : network.owner._id;
            return ownerId !== user.id;
          }) && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Public Networks From Others</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {networks
                  .filter(network => {
                    if (!user) return false;
                    const ownerId =
                      typeof network.owner === 'string' ? network.owner : network.owner._id;
                    return ownerId !== user.id;
                  })
                  .map(network => (
                    <div
                      key={network._id}
                      className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-green-500"
                    >
                      <div className="p-4">
                        <h2 className="text-xl font-bold mb-2">{network.name}</h2>
                        {network.description && (
                          <p className="text-gray-600 mb-4">{network.description}</p>
                        )}
                        <div className="flex items-center mb-4">
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            Public
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            Created: {new Date(network.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            By:{' '}
                            {typeof network.owner === 'string' ? 'Unknown' : network.owner.username}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className="w-full bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"
                            onClick={() => navigate(`/networks/${network._id}`)}
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NetworkList;
