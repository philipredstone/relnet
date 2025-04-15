import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFriendshipNetwork } from '../hooks/useFriendshipNetwork';
import { useNetworks } from '../context/NetworkContext';
import { motion, AnimatePresence } from 'framer-motion';
import ForceGraph2D from 'react-force-graph-2d';
import { 
  FaUserPlus, FaUserFriends, FaTrash, FaTimes, FaCog, 
  FaSearch, FaSearchPlus, FaSearchMinus, FaRedo, FaCompress
} from 'react-icons/fa';

const FriendshipNetwork: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { networks } = useNetworks();
  const navigate = useNavigate();
  const graphRef = useRef<any>(null);

  const {
    people,
    relationships,
    loading,
    error,
    createPerson,
    updatePerson,
    deletePerson,
    createRelationship,
    updateRelationship,
    deleteRelationship,
    refreshNetwork,
  } = useFriendshipNetwork(id || null);

  // Local state for the UI
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('add');
  const [newPerson, setNewPerson] = useState({
    firstName: '',
    lastName: '',
    birthday: '',
  });
  const [newRelationship, setNewRelationship] = useState({
    source: '',
    targets: [] as string[],
    type: 'freund',
    customType: '',
  });
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideRelationship, setOverrideRelationship] = useState<any | null>(null);
  const [graphSettings, setGraphSettings] = useState({
    chargeStrength: -150,
    linkDistance: 100,
    collideRadius: 50,
    velocityDecay: 0.4,
    showLabels: true,
    nodeSize: 20,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] });
  
  // Get current network info
  const currentNetwork = networks.find(network => network._id === id);

  // Redirect if network not found
  useEffect(() => {
    if (!loading && !currentNetwork && networks.length > 0) {
      navigate('/networks');
    }
  }, [currentNetwork, networks, loading, navigate]);

  // Update graph data when people or relationships change
  useEffect(() => {
    if (people && relationships) {
      const nodes = people.map(person => ({
        id: person.id,
        nodeId: person._id,
        firstName: person.firstName,
        lastName: person.lastName,
        label: `${person.firstName} ${person.lastName.charAt(0)}.`,
        birthday: person.birthday,
        x: person.position?.x,
        y: person.position?.y,
        // Dynamic size based on connection count
        val: 1 + relationships.filter(r => r.source === person.id || r.target === person.id).length * 0.5
      }));

      const links = relationships.map(rel => {
        // Different colors for different relationship types
        let color = '#9CA3AF'; // Default gray
        if (rel.type === 'freund') color = '#3B82F6'; // Blue
        if (rel.type === 'partner') color = '#EC4899'; // Pink
        if (rel.type === 'familie') color = '#10B981'; // Green
        if (rel.type === 'arbeitskolleg') color = '#F59E0B'; // Yellow

        return {
          source: rel.source,
          target: rel.target,
          id: rel.id,
          relId: rel._id,
          type: rel.type,
          color,
          // Visual elements
          value: rel.type === 'partner' ? 3 : rel.type === 'familie' ? 2 : 1,
        };
      });

      setGraphData({ nodes, links });
    }
  }, [people, relationships]);

  // Save node positions when they are dragged
  const handleNodeDragEnd = (node: any) => {
    if (node && node.x && node.y && node.nodeId) {
      updatePerson(node.nodeId, {
        position: { x: node.x, y: node.y }
      });
    }
  };

  // Add a new person to the network
  const handleAddPerson = async () => {
    if (newPerson.firstName.trim() === '' || newPerson.lastName.trim() === '') {
      alert('Please enter both first and last name');
      return;
    }

    try {
      await createPerson({
        firstName: newPerson.firstName.trim(),
        lastName: newPerson.lastName.trim(),
        birthday: newPerson.birthday || undefined,
        position: {
          // Generate a random position within the viewport
          x: 100 + Math.random() * 400,
          y: 100 + Math.random() * 300,
        },
      });

      setNewPerson({
        firstName: '',
        lastName: '',
        birthday: '',
      });
    } catch (error) {
      console.error('Error adding person:', error);
      alert('Failed to add person.');
    }
  };

  // Add new relationships between source person and multiple target people
  const handleAddRelationship = async () => {
    const { source, targets, type, customType } = newRelationship;

    if (source === '' || targets.length === 0) {
      alert('Please select source and at least one target person');
      return;
    }

    const actualType = type === 'custom' ? customType.trim() : type;

    if (type === 'custom' && customType.trim() === '') {
      alert('Please enter a custom relationship type');
      return;
    }

    // Check if any relationships already exist
    const existingRelationships: any[] = [];
    targets.forEach(target => {
      if (source !== target) {
        const existingEdge = relationships.find(
          edge =>
            (edge.source === source && edge.target === target) ||
            (edge.source === target && edge.target === source)
        );

        if (existingEdge) {
          existingRelationships.push({
            source,
            target,
            existingType: existingEdge.type,
            newType: actualType,
            edgeId: existingEdge.id,
          });
        }
      }
    });

    if (existingRelationships.length > 0) {
      // Show override modal
      setOverrideRelationship({
        existingRelationships,
        newRelationships: targets
          .filter(
            target => source !== target && !existingRelationships.some(rel => rel.target === target)
          )
          .map(target => ({ source, target, type: actualType })),
      });
      setShowOverrideModal(true);
      return;
    }

    // Process each target for new relationships
    const addPromises = targets
      .map(target => {
        if (source !== target) {
          return createRelationship({
            source,
            target,
            type: type as any,
            customType: type === 'custom' ? customType : undefined,
          });
        }
        return Promise.resolve();
      })
      .filter(Boolean);

    if (addPromises.length === 0) {
      alert('No valid relationships to add.');
      return;
    }

    try {
      await Promise.all(addPromises);
      setNewRelationship({ source: '', targets: [], type: 'freund', customType: '' });
    } catch (error) {
      console.error('Error adding relationships:', error);
      alert('Failed to add one or more relationships.');
    }
  };

  // Handle confirming relationship overrides
  const handleConfirmOverride = async () => {
    if (!overrideRelationship) return;

    const { existingRelationships, newRelationships } = overrideRelationship;

    try {
      // Remove existing relationships that will be overridden
      await Promise.all(existingRelationships.map(rel => deleteRelationship(rel.edgeId)));

      // Add new overridden relationships
      await Promise.all(
        existingRelationships.map(rel =>
          createRelationship({
            source: rel.source,
            target: rel.target,
            type: rel.newType as any,
            customType: rel.newType === 'custom' ? rel.customType : undefined,
          })
        )
      );

      // Add completely new relationships
      await Promise.all(
        newRelationships.map(rel =>
          createRelationship({
            source: rel.source,
            target: rel.target,
            type: rel.type as any,
            customType: rel.type === 'custom' ? rel.customType : undefined,
          })
        )
      );

      setShowOverrideModal(false);
      setOverrideRelationship(null);
      setNewRelationship({ source: '', targets: [], type: 'freund', customType: '' });
    } catch (error) {
      console.error('Error overriding relationships:', error);
      alert('Failed to override relationships.');
    }
  };

  // Handle canceling relationship overrides
  const handleCancelOverride = async () => {
    // If there are new relationships that don't need overrides, add those
    if (overrideRelationship && overrideRelationship.newRelationships.length > 0) {
      try {
        await Promise.all(
          overrideRelationship.newRelationships.map(rel =>
            createRelationship({
              source: rel.source,
              target: rel.target,
              type: rel.type as any,
              customType: rel.type === 'custom' ? rel.customType : undefined,
            })
          )
        );
      } catch (error) {
        console.error('Error adding new relationships:', error);
      }
    }

    setShowOverrideModal(false);
    setOverrideRelationship(null);
  };

  // Handle multiple selections in the targets dropdown
  const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setNewRelationship({ ...newRelationship, targets: selectedOptions });
  };

  // Delete a node and its associated edges
  const handleDeleteNode = async (id: string) => {
    if (
      window.confirm(
        'Are you sure you want to delete this person? All their relationships will also be deleted.'
      )
    ) {
      try {
        await deletePerson(id);
      } catch (error) {
        console.error('Error deleting person:', error);
        alert('Failed to delete person.');
      }
    }
  };

  // Get relationship type label
  const getRelationshipLabel = (type: string) => {
    switch (type) {
      case 'freund':
        return 'Freund/in';
      case 'partner':
        return 'Partner/in';
      case 'familie':
        return 'Familie/Verwandschaft';
      case 'arbeitskolleg':
        return 'Arbeitskolleg/innen';
      default:
        return type;
    }
  };

  // Remove a relationship between two people
  const handleRemoveRelationship = async (edgeId: string) => {
    try {
      await deleteRelationship(edgeId);
    } catch (error) {
      console.error('Error removing relationship:', error);
      alert('Failed to remove relationship.');
    }
  };

  // Graph control functions
  const zoomIn = () => {
    if (graphRef.current) {
      graphRef.current.zoom(1.2);
    }
  };

  const zoomOut = () => {
    if (graphRef.current) {
      graphRef.current.zoom(0.8);
    }
  };

  const centerGraph = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400);
    }
  };

  const refreshGraph = () => {
    refreshNetwork();
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle physics settings change
  const handleSettingChange = (setting: string, value: number | boolean) => {
    setGraphSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-900">
        <div className="bg-red-500 text-white p-4 rounded-lg shadow-lg max-w-md">
          <h3 className="text-lg font-bold mb-2">Error</h3>
          <p>{error}</p>
          <button 
            className="mt-4 bg-white text-red-500 px-4 py-2 rounded font-bold"
            onClick={() => navigate('/networks')}
          >
            Back to Networks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      {/* Mobile Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 bg-indigo-600 hover:bg-indigo-700 
          text-white p-3 rounded-full shadow-lg transition-all duration-300"
      >
        {sidebarOpen ? <FaTimes /> : <FaUserPlus />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ x: -320 }} 
            animate={{ x: 0 }} 
            exit={{ x: -320 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-80 bg-slate-800 border-r border-slate-700 h-full overflow-y-auto z-10 shadow-xl"
          >
            <div className="p-5">
              <h2 className="text-xl font-bold text-indigo-400 mb-4 truncate">
                {currentNetwork?.name || 'Relationship Network'}
              </h2>

              {/* Tabs */}
              <div className="flex border-b border-slate-700 mb-6">
                <button 
                  className={`flex-1 py-2 font-medium ${activeTab === 'add' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400'}`}
                  onClick={() => setActiveTab('add')}
                >
                  Add
                </button>
                <button 
                  className={`flex-1 py-2 font-medium ${activeTab === 'view' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400'}`}
                  onClick={() => setActiveTab('view')}
                >
                  View
                </button>
                <button 
                  className={`flex-1 py-2 font-medium ${activeTab === 'settings' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400'}`}
                  onClick={() => setActiveTab('settings')}
                >
                  <FaCog />
                </button>
              </div>

              {activeTab === 'add' && (
                <>
                  {/* Add Person Form */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-3 flex items-center text-indigo-300">
                      <FaUserPlus className="mr-2" /> Add Person
                    </h3>
                    <div className="bg-slate-900 p-4 rounded-lg">
                      <input
                        type="text"
                        className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 mb-3 
                          focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                        placeholder="First Name"
                        value={newPerson.firstName}
                        onChange={e => setNewPerson({ ...newPerson, firstName: e.target.value })}
                      />
                      <input
                        type="text"
                        className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 mb-3 
                          focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                        placeholder="Last Name"
                        value={newPerson.lastName}
                        onChange={e => setNewPerson({ ...newPerson, lastName: e.target.value })}
                      />
                      <input
                        type="date"
                        className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 mb-3 
                          focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                        placeholder="Birthday (Optional)"
                        value={newPerson.birthday}
                        onChange={e => setNewPerson({ ...newPerson, birthday: e.target.value })}
                      />
                      <button
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 
                          rounded-md transition-colors duration-200 flex items-center justify-center"
                        onClick={handleAddPerson}
                      >
                        <FaUserPlus className="mr-2" /> Add Person
                      </button>
                    </div>
                  </div>

                  {/* Add Relationship Form */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center text-indigo-300">
                      <FaUserFriends className="mr-2" /> Add Relationship
                    </h3>
                    <div className="bg-slate-900 p-4 rounded-lg">
                      <select
                        className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 mb-3 
                          focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                        value={newRelationship.source}
                        onChange={e => setNewRelationship({ ...newRelationship, source: e.target.value })}
                      >
                        <option value="">Select first person</option>
                        {people.map(node => (
                          <option key={`source-${node.id}`} value={node.id}>
                            {node.firstName} {node.lastName}
                          </option>
                        ))}
                      </select>

                      <select
                        className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 mb-1
                          focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                        multiple
                        size={Math.min(people.length, 5)}
                        value={newRelationship.targets}
                        onChange={handleTargetChange}
                      >
                        {people.map(node => (
                          <option key={`target-${node.id}`} value={node.id}>
                            {node.firstName} {node.lastName}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-400 mb-3">Hold Ctrl/Cmd to select multiple people</p>

                      <select
                        className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 mb-3
                          focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                        value={newRelationship.type}
                        onChange={e => setNewRelationship({ ...newRelationship, type: e.target.value })}
                      >
                        <option value="freund">Freund/in</option>
                        <option value="partner">Partner/in</option>
                        <option value="familie">Familie/Verwandschaft</option>
                        <option value="arbeitskolleg">Arbeitskolleg/innen</option>
                        <option value="custom">Custom...</option>
                      </select>

                      {newRelationship.type === 'custom' && (
                        <input
                          type="text"
                          className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 mb-3
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                          placeholder="Enter custom relationship type"
                          value={newRelationship.customType}
                          onChange={e =>
                            setNewRelationship({ ...newRelationship, customType: e.target.value })
                          }
                        />
                      )}

                      <button
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4
                          rounded-md transition-colors duration-200 flex items-center justify-center"
                        onClick={handleAddRelationship}
                      >
                        <FaUserFriends className="mr-2" /> Add Relationship
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'view' && (
                <>
                  {/* People List */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-3 flex items-center text-indigo-300">
                      <FaUserPlus className="mr-2" /> People ({people.length})
                    </h3>
                    {people.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {people.map(node => (
                          <div key={node.id} className="bg-slate-900 p-3 rounded-md flex justify-between items-center">
                            <span className="truncate mr-2">{node.firstName} {node.lastName}</span>
                            <button 
                              onClick={() => handleDeleteNode(node.id)}
                              className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-slate-800 transition-colors"
                              title="Delete Person"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-center py-4 bg-slate-900 rounded-md">
                        No people added yet.
                      </p>
                    )}
                  </div>

                  {/* Relationships List */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center text-indigo-300">
                      <FaUserFriends className="mr-2" /> Relationships ({relationships.length})
                    </h3>
                    {relationships.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {relationships.map(edge => {
                          const source = people.find(n => n.id === edge.source);
                          const target = people.find(n => n.id === edge.target);
                          if (!source || !target) return null;

                          return (
                            <div key={edge.id} className="bg-slate-900 p-3 rounded-md">
                              <div className="flex justify-between items-center">
                                <div className="truncate">
                                  <span>{source.firstName} {source.lastName.charAt(0)}.</span>
                                  <span className="mx-2">↔</span>
                                  <span>{target.firstName} {target.lastName.charAt(0)}.</span>
                                </div>
                                <button 
                                  onClick={() => handleRemoveRelationship(edge.id)}
                                  className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-slate-800 transition-colors ml-2"
                                  title="Delete Relationship"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                              <div className="text-xs text-indigo-300 mt-1">
                                {getRelationshipLabel(edge.type)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-center py-4 bg-slate-900 rounded-md">
                        No relationships added yet.
                      </p>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'settings' && (
                <div className="bg-slate-900 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-indigo-300">Graph Physics Settings</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Charge Strength ({graphSettings.chargeStrength})
                    </label>
                    <input 
                      type="range" 
                      min="-300" 
                      max="-30" 
                      value={graphSettings.chargeStrength}
                      onChange={(e) => handleSettingChange('chargeStrength', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-slate-400 mt-1">Stronger negative values push nodes apart more</p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Link Distance ({graphSettings.linkDistance})
                    </label>
                    <input 
                      type="range" 
                      min="30" 
                      max="200" 
                      value={graphSettings.linkDistance}
                      onChange={(e) => handleSettingChange('linkDistance', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-slate-400 mt-1">Higher values increase distance between connected nodes</p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Collision Radius ({graphSettings.collideRadius})
                    </label>
                    <input 
                      type="range" 
                      min="10" 
                      max="100" 
                      value={graphSettings.collideRadius}
                      onChange={(e) => handleSettingChange('collideRadius', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-slate-400 mt-1">Higher values prevent node overlap more</p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Velocity Decay ({graphSettings.velocityDecay})
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.01"
                      value={graphSettings.velocityDecay}
                      onChange={(e) => handleSettingChange('velocityDecay', parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-slate-400 mt-1">Higher values make the graph settle faster</p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Node Size ({graphSettings.nodeSize})
                    </label>
                    <input 
                      type="range" 
                      min="10" 
                      max="40" 
                      value={graphSettings.nodeSize}
                      onChange={(e) => handleSettingChange('nodeSize', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="showLabels"
                      checked={graphSettings.showLabels}
                      onChange={(e) => handleSettingChange('showLabels', e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-700 border-slate-600 focus:ring-indigo-500 focus:ring-2"
                    />
                    <label htmlFor="showLabels" className="ml-2 text-sm text-slate-300">
                      Show Labels
                    </label>
                  </div>

                  <button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 
                      rounded-md transition-colors duration-200 mt-2"
                    onClick={centerGraph}
                  >
                    Reset View
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Graph Area */}
      <div className="flex-1 relative">
        <div className="absolute inset-0">
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            nodeLabel={node => `${node.firstName} ${node.lastName}`}
            nodeRelSize={graphSettings.nodeSize}
            nodeVal={node => node.val * graphSettings.nodeSize / 10}
            nodeColor={node => {
              // Different colors for different node types or connections
              const connCount = graphData.links.filter(
                (link: any) => link.source.id === node.id || link.target.id === node.id
              ).length;
              
              // Color scales from blue to purple based on number of connections
              return connCount === 0 ? '#4B5563' :  // Gray for isolated nodes
                connCount < 3 ? '#3B82F6' :         // Blue for few connections
                connCount < 6 ? '#8B5CF6' :         // Indigo for moderate
                '#A855F7';                          // Purple for many
            }}
            linkWidth={link => link.value}
            linkColor={link => link.color}
            nodeCanvasObjectMode={() => graphSettings.showLabels ? 'after' : undefined}
            nodeCanvasObject={(node, ctx, globalScale) => {
              if (!graphSettings.showLabels) return;
              
              const label = node.label;
              const fontSize = 12/globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
              
              // Draw background for better readability
              const textWidth = ctx.measureText(label).width;
              ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
              ctx.fillRect(
                node.x - textWidth/2 - 2,
                node.y + graphSettings.nodeSize/globalScale + 2,
                textWidth + 4,
                fontSize + 2
              );
              
              // Draw text
              ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
              ctx.fillText(
                label,
                node.x,
                node.y + graphSettings.nodeSize/globalScale + fontSize/2 + 3
              );
            }}
            linkDirectionalParticles={3}
            linkDirectionalParticleWidth={link => link.value}
            linkDirectionalParticleSpeed={0.005}
            d3AlphaDecay={0.02}
            d3VelocityDecay={graphSettings.velocityDecay}
            cooldownTicks={100}
            onNodeDragEnd={handleNodeDragEnd}
            // Physics settings
            d3Force={(forceName, force) => {
              if (forceName === 'charge') {
                force.strength(graphSettings.chargeStrength);
              }
              if (forceName === 'link') {
                force.distance(graphSettings.linkDistance);
              }
              if (forceName === 'collide') {
                force.radius(graphSettings.collideRadius);
              }
            }}
            enableNodeDrag={true}
            enableZoomInteraction={true}
            enablePanInteraction={true}
            onNodeClick={(node) => {
              // Center view on node when clicked
              if (graphRef.current) {
                graphRef.current.centerAt(node.x, node.y, 1000);
                graphRef.current.zoom(1.5, 1000);
              }
            }}
          />
        </div>

        {/* Graph Controls */}
        <div className="absolute bottom-5 right-5 flex flex-col space-y-2">
          <button 
            onClick={zoomIn}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-colors"
            title="Zoom In"
          >
            <FaSearchPlus />
          </button>
          <button 
            onClick={zoomOut}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-colors"
            title="Zoom Out"
          >
            <FaSearchMinus />
          </button>
          <button 
            onClick={centerGraph}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-colors"
            title="Center Graph"
          >
            <FaCompress />
          </button>
          <button 
            onClick={refreshGraph}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-colors"
            title="Refresh Data"
          >
            <FaRedo />
          </button>
        </div>

        {/* Mobile Controls */}
        <div className="absolute top-5 right-5 lg:hidden">
          <button 
            onClick={centerGraph}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg mr-2"
            title="Center Graph"
          >
            <FaCompress />
          </button>
        </div>
      </div>

      {/* Override Confirmation Modal */}
      <AnimatePresence>
        {showOverrideModal && overrideRelationship && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-800 rounded-lg p-6 max-w-md w-full shadow-2xl border border-slate-700"
            >
              <h3 className="text-xl font-bold mb-4 text-indigo-300">Existing Relationship(s)</h3>
              <p className="mb-4 text-slate-300">
                {overrideRelationship.existingRelationships.length === 1
                  ? 'There is already a relationship between these people:'
                  : 'There are already relationships between these people:'}
              </p>

              <div className="mb-4 max-h-64 overflow-y-auto">
                <ul className="divide-y divide-slate-700 border border-slate-700 rounded-lg">
                  {overrideRelationship.existingRelationships.map((rel: any, index: number) => {
                    const source = people.find(n => n.id === rel.source);
                    const target = people.find(n => n.id === rel.target);
                    if (!source || !target) return null;

                    return (
                      <li key={index} className="p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">
                            {source.firstName} {source.lastName.charAt(0)}. ↔ {target.firstName}{' '}
                            {target.lastName.charAt(0)}.
                          </span>
                        </div>
                        <div className="flex justify-between text-xs mt-2">
                          <span className="text-slate-400">
                            Current: {getRelationshipLabel(rel.existingType)}
                          </span>
                          <span className="text-indigo-400">
                            New: {getRelationshipLabel(rel.newType)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <p className="mb-6 text-slate-300">Do you want to override the existing relationship(s)?</p>

              <div className="flex justify-end space-x-3">
                <button
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors"
                  onClick={handleCancelOverride}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                  onClick={handleConfirmOverride}
                >
                  Override
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FriendshipNetwork;