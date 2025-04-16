import React, { useState } from 'react';
import { useNetworks } from '../../context/NetworkContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaNetworkWired, FaTrash, FaEye, FaGlobe, FaLock, FaTimes } from 'react-icons/fa';

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

  // Filter networks by ownership
  const myNetworks = networks.filter(network => {
    if (!user) return false;
    const ownerId = typeof network.owner === 'string' ? network.owner : network.owner._id;
    return ownerId === user.id;
  });

  const publicNetworks = networks.filter(network => {
    if (!user) return false;
    const ownerId = typeof network.owner === 'string' ? network.owner : network.owner._id;
    return ownerId !== user.id;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 min-h-screen text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-indigo-400">
            <FaNetworkWired className="inline-block mr-2" />
            My Networks
          </h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg
              shadow-lg transition-colors duration-200 flex items-center"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? <FaTimes className="mr-2" /> : <FaPlus className="mr-2" />}
            {showCreateForm ? 'Cancel' : 'Create New Network'}
          </motion.button>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-white px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Create Network Form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700"
            >
              <h2 className="text-xl font-semibold mb-4 text-indigo-300">Create New Network</h2>

              {formError && (
                <div className="bg-red-900 border border-red-700 text-white px-4 py-3 rounded-lg mb-4">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateNetwork} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="name">
                    Network Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newNetworkName}
                    onChange={e => setNewNetworkName(e.target.value)}
                    required
                    placeholder="Enter network name"
                  />
                </div>

                <div>
                  <label
                    className="block text-slate-300 text-sm font-medium mb-2"
                    htmlFor="description"
                  >
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newNetworkDescription}
                    onChange={e => setNewNetworkDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe your network"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-indigo-600 bg-slate-700 border-slate-600
                        focus:ring-indigo-500 rounded"
                      checked={isPublic}
                      onChange={e => setIsPublic(e.target.checked)}
                    />
                    <span className="ml-2 text-slate-300 text-sm font-medium">
                      Make this network public
                    </span>
                  </label>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 
                    rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center"
                  disabled={createLoading}
                >
                  {createLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaPlus className="mr-2" /> Create Network
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Networks List */}
        {networks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-800 p-8 rounded-lg text-center border border-slate-700 shadow-xl"
          >
            <div className="flex justify-center mb-4">
              <FaNetworkWired className="text-4xl text-slate-400" />
            </div>
            <p className="text-slate-300 mb-6">You don't have any networks yet.</p>
            {!showCreateForm && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6
                  rounded-lg shadow-lg transition-colors duration-200 flex items-center mx-auto"
                onClick={() => setShowCreateForm(true)}
              >
                <FaPlus className="mr-2" /> Create Your First Network
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-12">
            {/* My Networks Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-indigo-300 flex items-center">
                <FaNetworkWired className="mr-2" /> My Networks ({myNetworks.length})
              </h2>

              {myNetworks.length === 0 ? (
                <p className="text-slate-400 bg-slate-800 p-4 rounded-lg border border-slate-700">
                  You haven't created any networks yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myNetworks.map(network => (
                    <motion.div
                      key={network._id}
                      whileHover={{ y: -5 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-800 rounded-lg shadow-xl overflow-hidden border border-slate-700 hover:border-indigo-500 transition-colors duration-200"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold text-white">{network.name}</h3>
                          {network.isPublic ? (
                            <FaGlobe className="text-green-400" title="Public" />
                          ) : (
                            <FaLock className="text-amber-400" title="Private" />
                          )}
                        </div>

                        {network.description && (
                          <p className="text-slate-300 mb-4 text-sm">{network.description}</p>
                        )}

                        <div className="text-xs text-slate-400 mb-6">
                          Created: {new Date(network.createdAt).toLocaleDateString()}
                        </div>

                        <div className="flex space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4
                              rounded-lg transition-colors duration-200 flex items-center justify-center"
                            onClick={() => navigate(`/networks/${network._id}`)}
                          >
                            <FaEye className="mr-2" /> View
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 bg-red-700 hover:bg-red-800 text-white py-2 px-4
                              rounded-lg transition-colors duration-200 flex items-center justify-center"
                            onClick={() => handleDeleteNetwork(network._id)}
                          >
                            <FaTrash className="mr-2" /> Delete
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Public Networks Section */}
            {publicNetworks.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-indigo-300 flex items-center">
                  <FaGlobe className="mr-2" /> Public Networks ({publicNetworks.length})
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {publicNetworks.map(network => (
                    <motion.div
                      key={network._id}
                      whileHover={{ y: -5 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-800 rounded-lg shadow-xl overflow-hidden border border-slate-700 border-l-4 border-l-green-500"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold text-white">{network.name}</h3>
                          <FaGlobe className="text-green-400" title="Public" />
                        </div>

                        {network.description && (
                          <p className="text-slate-300 mb-4 text-sm">{network.description}</p>
                        )}

                        <div className="flex justify-between mb-6">
                          <span className="text-xs text-slate-400">
                            Created: {new Date(network.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs font-medium text-green-400">
                            By:{' '}
                            {typeof network.owner === 'string' ? 'Unknown' : network.owner.username}
                          </span>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4
                            rounded-lg transition-colors duration-200 flex items-center justify-center"
                          onClick={() => navigate(`/networks/${network._id}`)}
                        >
                          <FaEye className="mr-2" /> View Network
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkList;
