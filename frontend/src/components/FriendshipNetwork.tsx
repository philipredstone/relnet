import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFriendshipNetwork } from '../hooks/useFriendshipNetwork';
import { useNetworks } from '../context/NetworkContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Transition } from '@headlessui/react';
import {
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaCog,
  FaCompress,
  FaEdit,
  FaExclamationTriangle,
  FaHome,
  FaInfo,
  FaPlus,
  FaRedo,
  FaRegCalendarAlt,
  FaSave,
  FaSearch,
  FaSearchMinus,
  FaSearchPlus,
  FaStar,
  FaTimes,
  FaTrash,
  FaUserCircle,
  FaUserFriends,
  FaUserPlus,
} from 'react-icons/fa';

// Import custom UI components
import {
  Button,
  Card,
  CardBody,
  ConfirmDialog,
  EmptyState,
  FormField,
  Modal,
  NetworkStats,
  Toast,
  ToastItem,
  Tooltip,
} from './FriendshipNetworkComponents';

// Import visible canvas graph component
import CanvasGraph from './CanvasGraph';
import { getRelationshipColor, RELATIONSHIP_TYPES, RELATIONSHIPS } from '../types/RelationShipTypes';
import { FormErrors, PersonNode } from '../interfaces/IPersonNode';


// Main FriendshipNetwork component
const FriendshipNetwork: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { networks } = useNetworks();
  const navigate = useNavigate();
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [graphDimensions, setGraphDimensions] = useState({ width: 0, height: 0 });

  // Network data state from custom hook
  const {
    people,
    relationships,
    loading,
    error,
    createPerson,
    updatePerson,
    deletePerson,
    createRelationship,
    deleteRelationship,
    refreshNetwork,
    updatePersonPosition: updatePersonPositionImpl = (id: string, position: { x: number; y: number }) => {
      console.warn('updatePersonPosition not implemented');
      return Promise.resolve();
    },
  } = useFriendshipNetwork(id || null) as any;

  // Create a type-safe wrapper for updatePersonPosition
  const updatePersonPosition = (id: string, position: { x: number; y: number }) => {
    return updatePersonPositionImpl(id, position);
  };

  // Local UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('overview');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [interactionHint, setInteractionHint] = useState(true);

  // Modal states
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [relationshipModalOpen, setRelationshipModalOpen] = useState(false);
  const [personDetailModalOpen, setPersonDetailModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string }>({
    type: '', id: '',
  });

  // Form errors
  const [personFormErrors, setPersonFormErrors] = useState<FormErrors>({});
  const [relationshipFormErrors, setRelationshipFormErrors] = useState<FormErrors>({});

  // Form states
  const [newPerson, setNewPerson] = useState({
    firstName: '', lastName: '', birthday: null as Date | null, notes: '',
  });

  const [editPerson, setEditPerson] = useState<PersonNode | null>(null);

  const [newRelationship, setNewRelationship] = useState({
    source: '', target: '', type: 'friend' as RELATIONSHIP_TYPES, customType: '', notes: '', bidirectional: true,
  });

  // Filter states
  const [peopleFilter, setPeopleFilter] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState('');
  const [relationshipTypeFilter, setRelationshipTypeFilter] = useState('all');

  // Settings state
  const [settings, setSettings] = useState({
    darkMode: true,
    autoLayout: true,
    showLabels: true,
    animationSpeed: 'medium',
    highlightConnections: true,
    nodeSize: 'medium',
  });

  // Selected person state for highlighting
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  // Get current network info
  const currentNetwork = networks.find(network => network._id === id);

  // Effect for graph container dimensions
  useEffect(() => {
    if (!graphContainerRef.current) return;

    const updateDimensions = () => {
      if (graphContainerRef.current) {
        const { width, height } = graphContainerRef.current.getBoundingClientRect();

        setGraphDimensions(prev => {
          if (prev.width !== width || prev.height !== height) {
            return { width, height };
          }
          return prev;
        });
      }
    };

    // Initial measurement
    updateDimensions();

    // Set up resize observer
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (graphContainerRef.current) {
      resizeObserver.observe(graphContainerRef.current);
    }

    // Set up window resize listener
    window.addEventListener('resize', updateDimensions);

    // Clean up
    return () => {
      if (graphContainerRef.current) {
        resizeObserver.unobserve(graphContainerRef.current);
      }
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Update dimensions when sidebar is toggled
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (graphContainerRef.current) {
        const { width, height } = graphContainerRef.current.getBoundingClientRect();
        setGraphDimensions({ width, height });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [sidebarOpen]);

  // Dismiss interaction hint after 10 seconds
  useEffect(() => {
    if (interactionHint) {
      const timer = setTimeout(() => {
        setInteractionHint(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [interactionHint]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only apply shortcuts when not in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Ctrl/Cmd + / to open help modal
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setHelpModalOpen(true);
      }

      // + for zoom in
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      }

      // - for zoom out
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      }

      // 0 for reset zoom
      if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }

      // n for new person
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setPersonModalOpen(true);
      }

      // r for new relationship
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setRelationshipModalOpen(true);
      }

      // s for toggle sidebar
      if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered people and relationships
  const filteredPeople = people.filter(person => `${person.firstName} ${person.lastName}`.toLowerCase().includes(peopleFilter.toLowerCase()));

  const filteredRelationships = relationships.filter(rel => {
    const source = people.find(p => p._id === rel.source);
    const target = people.find(p => p._id === rel.target);

    if (!source || !target) return false;

    const matchesFilter = `${source.firstName} ${source.lastName} ${target.firstName} ${target.lastName}`
      .toLowerCase()
      .includes(relationshipFilter.toLowerCase());

    const matchesType = relationshipTypeFilter === 'all' || rel.type === relationshipTypeFilter;

    return matchesFilter && matchesType;
  });

  // Add toast notification
  const addToast = (message: string, type: 'error' | 'success' | 'warning' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type, onClose: () => removeToast(id) }]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  // Remove toast notification
  const removeToast = (id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  // Smart node placement for new people
  const getSmartNodePosition = useCallback(() => {
    const centerX = graphDimensions.width / 2;
    const centerY = graphDimensions.height / 2;
    const maxRadius = Math.min(graphDimensions.width, graphDimensions.height) * 0.4;
    const totalNodes = people.length;
    const index = totalNodes;

    if (totalNodes <= 0) {
      return { x: centerX, y: centerY };
    } else if (totalNodes <= 4) {
      const theta = index * 2.399;
      const radius = maxRadius * 0.5 * Math.sqrt(index / (totalNodes + 1));
      return {
        x: centerX + radius * Math.cos(theta), y: centerY + radius * Math.sin(theta),
      };
    } else if (totalNodes <= 11) {
      const isOuterRing = index >= Math.floor(totalNodes / 2);
      const ringIndex = isOuterRing ? index - Math.floor(totalNodes / 2) : index;
      const ringTotal = isOuterRing ? totalNodes - Math.floor(totalNodes / 2) + 1 : Math.floor(totalNodes / 2);
      const ringRadius = isOuterRing ? maxRadius * 0.8 : maxRadius * 0.4;

      const angle = (ringIndex / ringTotal) * 2 * Math.PI + (isOuterRing ? 0 : Math.PI / ringTotal);
      return {
        x: centerX + ringRadius * Math.cos(angle), y: centerY + ringRadius * Math.sin(angle),
      };
    } else {
      const clusterCount = Math.max(3, Math.floor(Math.sqrt(totalNodes)));
      const clusterIndex = index % clusterCount;

      const clusterAngle = (clusterIndex / clusterCount) * 2 * Math.PI;
      const clusterDistance = maxRadius * 0.6;
      const clusterX = centerX + clusterDistance * Math.cos(clusterAngle);
      const clusterY = centerY + clusterDistance * Math.sin(clusterAngle);

      const clusterRadius = maxRadius * 0.3;
      const randomAngle = Math.random() * 2 * Math.PI;
      const randomDistance = Math.random() * clusterRadius;

      return {
        x: clusterX + randomDistance * Math.cos(randomAngle), y: clusterY + randomDistance * Math.sin(randomAngle),
      };
    }
  }, [graphDimensions.width, graphDimensions.height, people.length]);

  // Transform API data to graph format
  const getGraphData = useCallback(() => {
    if (!people || !relationships) {
      return { nodes: [], edges: [], links: [] };
    }

    // Create nodes
    const graphNodes = people.map(person => {
      const connectionCount = relationships.filter(r => r.source === person._id || r.target === person._id).length;

      // Determine if node should be highlighted
      const isSelected = person._id === selectedPersonId;
      const isConnected = selectedPersonId ? relationships.some(r => (r.source === selectedPersonId && r.target === person._id) || (r.target === selectedPersonId && r.source === person._id)) : false;

      // Determine background color based on connection count or highlight state
      let bgColor;
      if (isSelected) {
        bgColor = '#F472B6'; // Pink-400 for selected
      } else if (isConnected && settings.highlightConnections) {
        bgColor = '#A78BFA'; // Violet-400 for connected
      } else if (connectionCount === 0) {
        bgColor = '#94A3B8'; // Slate-400
      } else if (connectionCount === 1) {
        bgColor = '#38BDF8'; // Sky-400
      } else if (connectionCount <= 3) {
        bgColor = '#818CF8'; // Indigo-400
      } else if (connectionCount <= 5) {
        bgColor = '#A78BFA'; // Violet-400
      } else {
        bgColor = '#F472B6'; // Pink-400
      }

      return {
        id: person._id,
        firstName: person.firstName,
        lastName: person.lastName,
        connectionCount,
        bgColor,
        x: person.position?.x || 0,
        y: person.position?.y || 0,
        showLabel: settings.showLabels,
      };
    });

    // Create edges
    const graphEdges = relationships.map(rel => {
      const color = RELATIONSHIPS[rel.type as RELATIONSHIP_TYPES]?.color || RELATIONSHIPS.custom.color;
      const width = rel.type === 'partner' ? 4 : rel.type === 'family' ? 3 : rel.type === 'acquaintance' ? 2 : 1;

      // Highlight edges connected to selected node
      const isHighlighted = selectedPersonId && settings.highlightConnections && (rel.source === selectedPersonId || rel.target === selectedPersonId);

      return {
        id: rel._id, source: rel.source, target: rel.target, color: isHighlighted ? '#F472B6' : color, // Pink color for highlighted edges
        width: isHighlighted ? width + 1 : width, // Slightly thicker for highlighted
        type: rel.type, customType: rel.customType,
      };
    });

    return { nodes: graphNodes, edges: graphEdges, links: [] };
  }, [people, relationships, settings.showLabels, settings.highlightConnections, selectedPersonId]);

  // Validate person form
  const validatePersonForm = (person: typeof newPerson): FormErrors => {
    const errors: FormErrors = {};

    if (!person.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!person.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    return errors;
  };

  // Validate relationship form
  const validateRelationshipForm = (relationship: typeof newRelationship): FormErrors => {
    const errors: FormErrors = {};

    if (!relationship.source) {
      errors.source = 'Source person is required';
    }

    if (!relationship.target) {
      errors.target = 'Target person is required';
    }

    if (relationship.source === relationship.target) {
      errors.target = 'Source and target cannot be the same person';
    }

    if (relationship.type === 'custom' && !relationship.customType.trim()) {
      errors.customType = 'Custom relationship type is required';
    }

    // Check if relationship already exists
    if (relationship.source && relationship.target) {
      const existingRelationship = relationships.find(r => (r.source === relationship.source && r.target === relationship.target) || (relationship.bidirectional && r.source === relationship.target && r.target === relationship.source));

      if (existingRelationship) {
        errors.general = 'This relationship already exists';
      }
    }

    return errors;
  };

  // Handle person form submission
  const handlePersonSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validatePersonForm(newPerson);
    setPersonFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    // Create person with smart positioning
    const position = getSmartNodePosition();

    createPerson({
      firstName: newPerson.firstName.trim(),
      lastName: newPerson.lastName.trim(),
      birthday: newPerson.birthday?.toISOString() || undefined,
      notes: newPerson.notes,
      position,
    });

    // Reset form and close modal
    setNewPerson({
      firstName: '', lastName: '', birthday: null, notes: '',
    });

    setPersonModalOpen(false);
    addToast('Person added successfully');
  };

  // Handle person update
  const handleUpdatePerson = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editPerson) return;

    const errors = validatePersonForm(editPerson as any);
    setPersonFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    updatePerson(editPerson._id, {
      firstName: editPerson.firstName,
      lastName: editPerson.lastName,
      birthday: editPerson.birthday ? new Date(editPerson.birthday).toISOString() : undefined,
      notes: editPerson.notes,
    });

    setEditPerson(null);
    setPersonDetailModalOpen(false);
    addToast('Person updated successfully');
  };

  // Handle relationship form submission
  const handleRelationshipSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateRelationshipForm(newRelationship);
    setRelationshipFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    const { source, target, type, customType, notes, bidirectional } = newRelationship;

    // Create the relationship
    createRelationship({
      source, target, type, customType: type === 'custom' ? customType : undefined, notes,
    });

    // Create bidirectional relationship if selected
    if (bidirectional && source !== target) {
      createRelationship({
        source: target, target: source, type, customType: type === 'custom' ? customType : undefined, notes,
      });
    }

    // Reset form and close modal
    setNewRelationship({
      source: '', target: '', type: 'friend', customType: '', notes: '', bidirectional: true,
    });

    setRelationshipModalOpen(false);
    addToast(`Relationship${bidirectional ? 's' : ''} created successfully`);
  };

  // Handle deletion confirmation
  const confirmDelete = (type: string, id: string) => {
    setItemToDelete({ type, id });
    setDeleteConfirmOpen(true);
  };

  // Execute deletion
  const executeDelete = () => {
    const { type, id } = itemToDelete;

    if (type === 'person') {
      deletePerson(id);
      addToast('Person deleted');
    } else if (type === 'relationship') {
      deleteRelationship(id);
      addToast('Relationship deleted');
    }
  };

  // Open person detail modal
  const openPersonDetail = (person: PersonNode) => {
    setEditPerson({ ...person });
    setPersonDetailModalOpen(true);
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle refresh network
  const handleRefreshNetwork = () => {
    refreshNetwork();
    addToast('Network refreshed');
  };

  // Handle node click to select and highlight
  const handleNodeClick = (nodeId: string) => {
    // Toggle selection
    if (selectedPersonId === nodeId) {
      setSelectedPersonId(null);
    } else {
      setSelectedPersonId(nodeId);
    }

    // Open person details
    const person = people.find(p => p._id === nodeId);
    if (person) {
      openPersonDetail(person);
    }
  };

  // Sort people alphabetically
  const sortedPeople = [...filteredPeople].sort((a, b) => {
    const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
    const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // Loading state
  if (loading) {
    return (<div className="flex justify-center items-center h-screen bg-slate-900">
        <div className="flex flex-col items-center space-y-4">
          <div
            className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 border-solid rounded-full animate-spin"></div>
          <p className="text-white text-lg">Loading your network...</p>
        </div>
      </div>);
  }

  // Error state
  if (error) {
    return (<div className="flex justify-center items-center h-screen bg-slate-900">
        <div className="bg-red-500/20 border border-red-500 text-white p-6 rounded-lg shadow-lg max-w-md">
          <h3 className="text-lg font-bold mb-3 flex items-center">
            <FaExclamationTriangle className="mr-2 text-red-500" /> Error
          </h3>
          <p className="mb-4">{error}</p>
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate('/networks')}
            icon={<FaArrowLeft />}
          >
            Back to Networks
          </Button>
        </div>
      </div>);
  }

  // Generate graph data
  const graphData = getGraphData();

  return (<div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      {/* Sidebar Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 bg-indigo-600 hover:bg-indigo-700 
          text-white p-3 rounded-full shadow-lg transition-all duration-300"
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {sidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
      </button>

      {/* Sidebar */}
      <div
        className={`bg-slate-800 border-r border-slate-700 h-full transition-all duration-300 
        ease-in-out z-30 ${sidebarOpen ? 'w-72' : 'w-0'}`}
      >
        <Transition
          show={sidebarOpen}
          enter="transition-opacity duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="h-full overflow-y-auto p-4">
            {/* Network Header */}
            <div className="mb-6 mt-8">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <span className="truncate">{currentNetwork?.name || 'Relationship Network'}</span>
                </h2>
                <Tooltip text="Back to networks">
                  <button
                    onClick={() => navigate('/networks')}
                    className="p-2 text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    <FaHome />
                  </button>
                </Tooltip>
              </div>
              <p className="text-slate-400 text-sm">Visualize your connections</p>
            </div>

            {/* Network Stats */}
            <NetworkStats people={people} relationships={relationships} />

            {/* Action Buttons */}
            <div className="flex space-x-2 mb-6">
              <Button
                variant="primary"
                fullWidth
                onClick={() => setPersonModalOpen(true)}
                icon={<FaUserPlus />}
              >
                Add Person
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setRelationshipModalOpen(true)}
                icon={<FaUserFriends />}
              >
                Add Relation
              </Button>
            </div>

            {/* Sidebar Tabs */}
            <div className="flex border-b border-slate-700 mb-4">
              <button
                className={`flex-1 py-2 font-medium flex items-center justify-center ${sidebarTab === 'overview' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-slate-300'}`}
                onClick={() => setSidebarTab('overview')}
              >
                <FaInfo className="mr-2" /> Overview
              </button>
              <button
                className={`flex-1 py-2 font-medium flex items-center justify-center ${sidebarTab === 'people' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-slate-300'}`}
                onClick={() => setSidebarTab('people')}
              >
                <FaUserCircle className="mr-2" /> People
              </button>
              <button
                className={`flex-1 py-2 font-medium flex items-center justify-center ${sidebarTab === 'relations' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-slate-300'}`}
                onClick={() => setSidebarTab('relations')}
              >
                <FaUserFriends className="mr-2" /> Relations
              </button>
            </div>

            {/* Tab Content */}
            {sidebarTab === 'overview' && (<div className="space-y-4">
                <Card>
                  <CardBody>
                    <h3 className="font-medium mb-2 text-indigo-400">About This Network</h3>
                    <p className="text-sm text-slate-300 mb-3">
                      This interactive visualization shows relationships between people in your
                      network.
                    </p>
                    <ul className="text-xs text-slate-400 space-y-1">
                      <li className="flex items-start">
                        <span className="text-indigo-400 mr-2">•</span>
                        <span>Drag nodes to rearrange the network</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-indigo-400 mr-2">•</span>
                        <span>Click on people for more details</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-indigo-400 mr-2">•</span>
                        <span>Hover over connections to see relationship types</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-indigo-400 mr-2">•</span>
                        <span>Use the controls to zoom in/out and center the view</span>
                      </li>
                    </ul>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <h3 className="font-medium mb-2 text-indigo-400">Legend</h3>
                    <div className="space-y-2">
                      {Object.entries(RELATIONSHIPS).map(([type, { label, color }]) => (
                        <div key={type} className="flex items-center text-sm">
                          <div
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: color }}
                          ></div>
                          <span className="capitalize">
                            {RELATIONSHIPS[type]?.label}
                          </span>
                        </div>))}
                    </div>
                  </CardBody>
                </Card>

                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setSettingsModalOpen(true)}
                    icon={<FaCog />}
                  >
                    Settings
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setHelpModalOpen(true)}
                    icon={<FaInfo />}
                  >
                    Help
                  </Button>
                </div>
              </div>)}

            {sidebarTab === 'people' && (<div>
                <div className="flex items-center mb-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 pl-8 pr-3
                        text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                      placeholder="Search people..."
                      value={peopleFilter}
                      onChange={e => setPeopleFilter(e.target.value)}
                    />
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto pr-1">
                  {sortedPeople.length > 0 ? (sortedPeople.map(person => {
                      const connectionCount = relationships.filter(r => r.source === person._id || r.target === person._id).length;

                      return (<div
                          key={person._id}
                          className={`bg-slate-700 rounded-lg p-3 group hover:bg-slate-600 transition-colors 
                          cursor-pointer border-l-4 ${selectedPersonId === person._id ? 'border-l-pink-500' : connectionCount > 0 ? 'border-l-indigo-500' : 'border-l-slate-700'}`}
                          onClick={() => {
                            openPersonDetail(person);
                            setSelectedPersonId(person._id);
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">
                                {person.firstName} {person.lastName}
                              </h4>
                              <div className="flex items-center text-xs text-slate-400 mt-1">
                                <span
                                  className="inline-block w-2 h-2 rounded-full mr-1"
                                  style={{
                                    backgroundColor: connectionCount > 0 ? '#60A5FA' : '#94A3B8',
                                  }}
                                ></span>
                                {connectionCount} connection{connectionCount !== 1 ? 's' : ''}
                              </div>
                            </div>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Tooltip text="Edit">
                                <button
                                  className="p-1 text-slate-400 hover:text-indigo-400 transition-colors"
                                  onClick={e => {
                                    e.stopPropagation();
                                    openPersonDetail(person);
                                  }}
                                >
                                  <FaEdit size={14} />
                                </button>
                              </Tooltip>
                              <Tooltip text="Delete">
                                <button
                                  className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                                  onClick={e => {
                                    e.stopPropagation();
                                    confirmDelete('person', person._id);
                                  }}
                                >
                                  <FaTrash size={14} />
                                </button>
                              </Tooltip>
                            </div>
                          </div>
                        </div>);
                    })) : (<EmptyState
                      title={peopleFilter ? 'No matches found' : 'No people yet'}
                      description={peopleFilter ? 'Try adjusting your search criteria' : 'Add people to start building your network'}
                      icon={<FaUserCircle className="text-2xl text-slate-400" />}
                      action={!peopleFilter && (<Button
                          variant="primary"
                          size="sm"
                          onClick={() => setPersonModalOpen(true)}
                          icon={<FaUserPlus />}
                        >
                          Add Person
                        </Button>)}
                    />)}
                </div>
              </div>)}

            {sidebarTab === 'relations' && (<div>
                <div className="flex items-center mb-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 pl-8 pr-3
                        text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                      placeholder="Search relationships..."
                      value={relationshipFilter}
                      onChange={e => setRelationshipFilter(e.target.value)}
                    />
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div className="flex mb-3 overflow-x-auto pb-2 space-x-1">
                  <button
                    className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${relationshipTypeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    onClick={() => setRelationshipTypeFilter('all')}
                  >
                    All Types
                  </button>
                  {Object.entries(RELATIONSHIPS).map(([type, { label, color }]) => (<button
                      key={type}
                      className={`px-3 py-1 text-xs rounded-full whitespace-nowrap flex items-center ${relationshipTypeFilter === type ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                      onClick={() => setRelationshipTypeFilter(type as RELATIONSHIP_TYPES)}
                    >
                      <span
                        className="w-2 h-2 rounded-full mr-1"
                        style={{ backgroundColor: color }}
                      ></span>
                      <span className="capitalize">
                        {RELATIONSHIPS[type as RELATIONSHIP_TYPES]?.label}
                      </span>
                    </button>))}
                </div>

                <div className="space-y-2 max-h-[calc(100vh-390px)] overflow-y-auto pr-1">
                  {filteredRelationships.length > 0 ? (filteredRelationships.map(rel => {
                      const source = people.find(p => p._id === rel.source);
                      const target = people.find(p => p._id === rel.target);
                      if (!source || !target) return null;

                      return (<div
                          key={rel._id}
                          className={`bg-slate-700 rounded-lg p-3 group hover:bg-slate-600 transition-colors 
                          border-l-4 ${selectedPersonId === rel.source || selectedPersonId === rel.target ? 'border-l-pink-500' : 'border-l-slate-700'}`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="flex items-center">
                                <span
                                  className={`font-medium ${selectedPersonId === rel.source ? 'text-pink-400' : ''}`}
                                  onClick={e => {
                                    e.stopPropagation();
                                    setSelectedPersonId(rel.source);
                                    openPersonDetail(source);
                                  }}
                                >
                                  {source.firstName} {source.lastName}
                                </span>
                                <span className="mx-2 text-slate-400">→</span>
                                <span
                                  className={`font-medium ${selectedPersonId === rel.target ? 'text-pink-400' : ''}`}
                                  onClick={e => {
                                    e.stopPropagation();
                                    setSelectedPersonId(rel.target);
                                    const targetPerson = people.find(p => p._id === rel.target);
                                    if (targetPerson) openPersonDetail(targetPerson);
                                  }}
                                >
                                  {target.firstName} {target.lastName}
                                </span>
                              </div>
                              <div className="flex items-center text-xs text-slate-400 mt-1">
                                <span
                                  className="inline-block w-2 h-2 rounded-full mr-1"
                                  style={{ backgroundColor: RELATIONSHIPS[rel.type as RELATIONSHIP_TYPES]?.color }}
                                ></span>
                                <span className="capitalize">
                                 {rel.type === 'custom' ? rel.customType : RELATIONSHIPS[rel.type as RELATIONSHIP_TYPES]?.label}
                                </span>
                              </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Tooltip text="Delete">
                                <button
                                  className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                                  onClick={() => confirmDelete('relationship', rel._id)}
                                >
                                  <FaTrash size={14} />
                                </button>
                              </Tooltip>
                            </div>
                          </div>
                        </div>);
                    })) : (<EmptyState
                      title={relationshipFilter || relationshipTypeFilter !== 'all' ? 'No matches found' : 'No relationships yet'}
                      description={relationshipFilter || relationshipTypeFilter !== 'all' ? 'Try adjusting your search criteria' : 'Create relationships between people to visualize connections'}
                      icon={<FaUserFriends className="text-2xl text-slate-400" />}
                      action={!relationshipFilter && relationshipTypeFilter === 'all' && (<Button
                          variant="primary"
                          size="sm"
                          onClick={() => setRelationshipModalOpen(true)}
                          icon={<FaUserFriends />}
                        >
                          Add Relationship
                        </Button>)}
                    />)}
                </div>
              </div>)}
          </div>
        </Transition>
      </div>

      {/* Main Graph Area */}
      <div ref={graphContainerRef} className="flex-1 bg-slate-900 relative overflow-hidden">
        {graphDimensions.width <= 0 || graphDimensions.height <= 0 ? (
          <div className="w-full h-full flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>) : (<CanvasGraph
            data={graphData}
            width={graphDimensions.width}
            height={graphDimensions.height}
            zoomLevel={zoomLevel}
            onNodeClick={handleNodeClick}
            onNodeDrag={(nodeId, x, y) => {
              updatePersonPosition(nodeId, { x, y }).then();
            }}
          />)}

        {/* Empty state overlay */}
        {people.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
            <div className="text-center max-w-md p-6">
              <div className="inline-flex items-center justify-center p-4 bg-indigo-600/30 rounded-full mb-4">
                <FaUserPlus className="text-3xl text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Start Building Your Network</h2>
              <p className="text-slate-300 mb-6">
                Add people and create relationships between them to visualize your network
              </p>
              <Button
                variant="primary"
                onClick={() => setPersonModalOpen(true)}
                icon={<FaUserPlus />}
                size="lg"
              >
                Add Your First Person
              </Button>
            </div>
          </div>)}

        {/* Interaction hint */}
        {people.length > 0 && interactionHint && (<div
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-indigo-900/90 
          text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center space-x-2 animate-pulse"
          >
            <FaInfo className="text-indigo-400" />
            <span>Click on a person to see details, drag to reposition</span>
            <button
              className="ml-2 text-indigo-400 hover:text-white"
              onClick={() => setInteractionHint(false)}
            >
              <FaTimes />
            </button>
          </div>)}

        {/* Graph controls */}
        <div className="absolute bottom-6 right-6 flex flex-col space-y-3">
          <Tooltip text="Zoom In (shortcut: +)">
            <button
              className="bg-slate-800 hover:bg-indigo-600 text-white p-3 rounded-full shadow-lg transition-colors"
              onClick={handleZoomIn}
              aria-label="Zoom In"
            >
              <FaSearchPlus />
            </button>
          </Tooltip>
          <Tooltip text="Zoom Out (shortcut: -)">
            <button
              className="bg-slate-800 hover:bg-indigo-600 text-white p-3 rounded-full shadow-lg transition-colors"
              onClick={handleZoomOut}
              aria-label="Zoom Out"
            >
              <FaSearchMinus />
            </button>
          </Tooltip>
          <Tooltip text="Reset View (shortcut: 0)">
            <button
              className="bg-slate-800 hover:bg-indigo-600 text-white p-3 rounded-full shadow-lg transition-colors"
              onClick={handleResetZoom}
              aria-label="Reset View"
            >
              <FaCompress />
            </button>
          </Tooltip>
          <Tooltip text="Refresh Network">
            <button
              className="bg-slate-800 hover:bg-indigo-600 text-white p-3 rounded-full shadow-lg transition-colors"
              onClick={handleRefreshNetwork}
              aria-label="Refresh Network"
            >
              <FaRedo />
            </button>
          </Tooltip>
        </div>

        {/* Quick action buttons */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
          <Tooltip text="Add Person (shortcut: n)">
            <button
              onClick={() => setPersonModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-colors"
              aria-label="Add Person"
            >
              <FaUserPlus />
            </button>
          </Tooltip>
          <Tooltip text="Add Relationship (shortcut: r)">
            <button
              onClick={() => setRelationshipModalOpen(true)}
              className="bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-full shadow-lg transition-colors"
              aria-label="Add Relationship"
            >
              <FaUserFriends />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Add Person Modal */}
      <Modal
        isOpen={personModalOpen}
        onClose={() => {
          setPersonModalOpen(false);
          setPersonFormErrors({});
        }}
        title="Add New Person"
      >
        <form onSubmit={handlePersonSubmit} className="space-y-4">
          {personFormErrors.general && (
            <div className="bg-red-500/20 border border-red-500 text-white p-3 rounded-lg text-sm mb-4">
              {personFormErrors.general}
            </div>)}

          <FormField label="First Name" id="firstName" required error={personFormErrors.firstName}>
            <input
              id="firstName"
              type="text"
              className={`w-full bg-slate-700 border ${personFormErrors.firstName ? 'border-red-500' : 'border-slate-600'} 
              rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
              placeholder="Enter first name"
              autoFocus={true}
              value={newPerson.firstName}
              onChange={e => setNewPerson({ ...newPerson, firstName: e.target.value })}
            />
          </FormField>

          <FormField label="Last Name" id="lastName" required error={personFormErrors.lastName}>
            <input
              id="lastName"
              type="text"
              className={`w-full bg-slate-700 border ${personFormErrors.lastName ? 'border-red-500' : 'border-slate-600'} 
              rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
              placeholder="Enter last name"
              value={newPerson.lastName}
              onChange={e => setNewPerson({ ...newPerson, lastName: e.target.value })}
            />
          </FormField>

          <FormField label="Birthday (Optional)" id="birthday">
            <div className="relative">
              <DatePicker
                id="birthday"
                selected={newPerson.birthday}
                onChange={date => setNewPerson({ ...newPerson, birthday: date })}
                dateFormat="dd.MM.yyyy"
                placeholderText="Select birthday"
                className="w-full bg-slate-700 border border-slate-600 rounded-md p-2
                focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                showYearDropdown
                dropdownMode="select"
                wrapperClassName="w-full"
              />
              <FaRegCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            </div>
          </FormField>

          <FormField label="Notes (Optional)" id="notes">
            <textarea
              id="notes"
              className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 min-h-[80px]
              focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              placeholder="Add any additional information"
              value={newPerson.notes}
              onChange={e => setNewPerson({ ...newPerson, notes: e.target.value })}
            />
          </FormField>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setPersonModalOpen(false);
                setPersonFormErrors({});
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={<FaUserPlus />}>
              Add Person
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Relationship Modal */}
      <Modal
        isOpen={relationshipModalOpen}
        onClose={() => {
          setRelationshipModalOpen(false);
          setRelationshipFormErrors({});
        }}
        title="Add New Relationship"
      >
        <form onSubmit={handleRelationshipSubmit} className="space-y-4">
          {relationshipFormErrors.general && (
            <div className="bg-red-500/20 border border-red-500 text-white p-3 rounded-lg text-sm mb-4">
              {relationshipFormErrors.general}
            </div>)}

          <FormField
            label="Source Person"
            id="source"
            required
            error={relationshipFormErrors.source}
          >
            <select
              id="source"
              autoFocus={true}
              className={`w-full bg-slate-700 border ${relationshipFormErrors.source ? 'border-red-500' : 'border-slate-600'} 
              rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
              value={newRelationship.source}
              onChange={e => setNewRelationship({ ...newRelationship, source: e.target.value })}
            >
              <option value="">Select person</option>
              {sortedPeople.map(person => (<option key={`source-${person._id}`} value={person._id}>
                  {person.firstName} {person.lastName}
                </option>))}
            </select>
          </FormField>

          <FormField
            label="Target Person"
            id="target"
            required
            error={relationshipFormErrors.target}
          >
            <select
              id="target"
              className={`w-full bg-slate-700 border ${relationshipFormErrors.target ? 'border-red-500' : 'border-slate-600'} 
              rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
              value={newRelationship.target}
              onChange={e => setNewRelationship({ ...newRelationship, target: e.target.value })}
            >
              <option value="">Select person</option>
              {sortedPeople.map(person => (<option key={`target-${person._id}`} value={person._id}>
                  {person.firstName} {person.lastName}
                </option>))}
            </select>
          </FormField>

          <FormField label="Relationship Type" id="type" required>
            <select
              id="type"
              className="w-full bg-slate-700 border border-slate-600 rounded-md p-2
              focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              value={newRelationship.type}
              onChange={e => setNewRelationship({
                ...newRelationship, type: e.target.value as RELATIONSHIP_TYPES,
              })}
            >
              {Object.entries(RELATIONSHIPS).map(([value, { label }]) => (<option key={value} value={value}>
                  {label}
                </option>))}
            </select>
          </FormField>

          {newRelationship.type === 'custom' && (<FormField
              label="Custom Type"
              id="customType"
              required
              error={relationshipFormErrors.customType}
            >
              <input
                id="customType"
                type="text"
                className={`w-full bg-slate-700 border ${relationshipFormErrors.customType ? 'border-red-500' : 'border-slate-600'} 
                rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                placeholder="Enter custom relationship type"
                value={newRelationship.customType}
                onChange={e => setNewRelationship({
                  ...newRelationship, customType: e.target.value,
                })}
              />
            </FormField>)}

          <FormField label="Notes (Optional)" id="relationNotes">
            <textarea
              id="relationNotes"
              className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 min-h-[60px]
              focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              placeholder="Add any additional information"
              value={newRelationship.notes}
              onChange={e => setNewRelationship({ ...newRelationship, notes: e.target.value })}
            />
          </FormField>

          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              id="bidirectional"
              className="h-4 w-4 rounded border-gray-500 text-indigo-600 focus:ring-indigo-500 bg-slate-700"
              checked={newRelationship.bidirectional}
              onChange={e => setNewRelationship({
                ...newRelationship, bidirectional: e.target.checked,
              })}
            />
            <label htmlFor="bidirectional" className="ml-2 block text-sm text-gray-300">
              Create bidirectional relationship (recommended)
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setRelationshipModalOpen(false);
                setRelationshipFormErrors({});
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={<FaUserFriends />}>
              Add Relationship
            </Button>
          </div>
        </form>
      </Modal>

      {/* Person Detail Modal */}
      {editPerson && (<Modal
          isOpen={personDetailModalOpen}
          onClose={() => {
            setPersonDetailModalOpen(false);
            setEditPerson(null);
            setPersonFormErrors({});
          }}
          title={`${editPerson.firstName} ${editPerson.lastName}`}
        >
          <div className="space-y-6">
            <div className="space-y-4">
              <form onSubmit={handleUpdatePerson} className="space-y-4">
                {personFormErrors.general && (
                  <div className="bg-red-500/20 border border-red-500 text-white p-3 rounded-lg text-sm mb-4">
                    {personFormErrors.general}
                  </div>)}

                <FormField
                  label="First Name"
                  id="editFirstName"
                  required
                  error={personFormErrors.firstName}
                >
                  <input
                    id="editFirstName"
                    type="text"
                    className={`w-full bg-slate-700 border ${personFormErrors.firstName ? 'border-red-500' : 'border-slate-600'} 
                    rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                    value={editPerson.firstName || ''}
                    onChange={e => setEditPerson({ ...editPerson, firstName: e.target.value })}
                  />
                </FormField>

                <FormField
                  label="Last Name"
                  id="editLastName"
                  required
                  error={personFormErrors.lastName}
                >
                  <input
                    id="editLastName"
                    type="text"
                    className={`w-full bg-slate-700 border ${personFormErrors.lastName ? 'border-red-500' : 'border-slate-600'} 
                    rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                    value={editPerson.lastName || ''}
                    onChange={e => setEditPerson({ ...editPerson, lastName: e.target.value })}
                  />
                </FormField>

                <FormField label="Birthday" id="editBirthday">
                  <div className="relative">
                    <DatePicker
                      id="editBirthday"
                      selected={editPerson.birthday ? new Date(editPerson.birthday) : null}
                      onChange={date => setEditPerson({ ...editPerson, birthday: date })}
                      dateFormat="dd.MM.yyyy"
                      placeholderText="Select birthday"
                      className="w-full bg-slate-700 border border-slate-600 rounded-md p-2
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                      showYearDropdown
                      dropdownMode="select"
                      wrapperClassName="w-full"
                    />
                    <FaRegCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  </div>
                </FormField>

                <FormField label="Notes" id="editNotes">
                  <textarea
                    id="editNotes"
                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 min-h-[80px]
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                    value={editPerson.notes || ''}
                    onChange={e => setEditPerson({ ...editPerson, notes: e.target.value })}
                  />
                </FormField>

                <div className="flex justify-between pt-2">
                  <Button
                    variant="danger"
                    onClick={() => {
                      confirmDelete('person', editPerson._id);
                      setPersonDetailModalOpen(false);
                    }}
                    icon={<FaTrash />}
                  >
                    Delete
                  </Button>

                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setPersonDetailModalOpen(false);
                        setEditPerson(null);
                        setPersonFormErrors({});
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" icon={<FaSave />}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            <div>
              <h4 className="font-medium text-indigo-400 mb-2">Connections</h4>
              <div className="max-h-40 overflow-y-auto space-y-1 bg-slate-900 rounded-lg p-2">
                {relationships.filter(r => r.source === editPerson._id || r.target === editPerson._id).length > 0 ? (relationships
                    .filter(r => r.source === editPerson._id || r.target === editPerson._id)
                    .map(rel => {
                      const isSource = rel.source === editPerson._id;
                      const otherPersonId = isSource ? rel.target : rel.source;
                      const otherPerson = people.find(p => p._id === otherPersonId);

                      if (!otherPerson) return null;

                      return (<div
                          key={rel._id}
                          className="flex justify-between items-center py-1 px-2 hover:bg-slate-800 rounded"
                        >
                          <div className="flex items-center">
                            <span
                              className="inline-block w-2 h-2 rounded-full mr-2"
                              style={{ backgroundColor: RELATIONSHIPS[rel.type as RELATIONSHIP_TYPES]?.color }}
                            ></span>
                            <span className="text-sm">
                              {isSource ? 'To: ' : 'From: '}
                              <span
                                className="font-medium hover:text-indigo-400 cursor-pointer"
                                onClick={() => {
                                  setSelectedPersonId(otherPersonId);
                                  setPersonDetailModalOpen(false);
                                  setTimeout(() => {
                                    const targetPerson = people.find(p => p._id === otherPersonId);
                                    if (targetPerson) openPersonDetail(targetPerson);
                                  }, 100);
                                }}
                              >
                                {otherPerson.firstName} {otherPerson.lastName}
                              </span>
                              {rel.type === 'custom'
                                ? ` (${rel.customType})`
                                : ` (${RELATIONSHIPS[rel.type as RELATIONSHIP_TYPES]?.label})`}
                            </span>
                          </div>
                          <button
                            className="text-red-400 hover:text-red-300 transition-colors"
                            onClick={() => deleteRelationship(rel._id)}
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>);
                    })) : (<div className="text-center py-2 text-slate-400 text-sm">No connections yet</div>)}
              </div>
              <div className="mt-3 flex justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setNewRelationship({
                      ...newRelationship, source: editPerson._id,
                    });
                    setPersonDetailModalOpen(false);
                    setTimeout(() => setRelationshipModalOpen(true), 100);
                  }}
                  icon={<FaPlus />}
                >
                  Add New Connection
                </Button>
              </div>
            </div>
          </div>
        </Modal>)}

      {/* Settings Modal */}
      <Modal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        title="Network Settings"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">Show Labels</label>
            <div className="relative inline-block w-12 align-middle select-none">
              <input
                type="checkbox"
                id="showLabels"
                name="showLabels"
                className="sr-only"
                checked={settings.showLabels}
                onChange={() => setSettings({ ...settings, showLabels: !settings.showLabels })}
              />
              <div className="block h-6 bg-slate-700 rounded-full w-12"></div>
              <div
                className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform ${settings.showLabels ? 'transform translate-x-6 bg-indigo-500' : 'bg-gray-400'}`}
              ></div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">Auto Layout</label>
            <div className="relative inline-block w-12 align-middle select-none">
              <input
                type="checkbox"
                id="autoLayout"
                name="autoLayout"
                className="sr-only"
                checked={settings.autoLayout}
                onChange={() => setSettings({ ...settings, autoLayout: !settings.autoLayout })}
              />
              <div className="block h-6 bg-slate-700 rounded-full w-12"></div>
              <div
                className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform ${settings.autoLayout ? 'transform translate-x-6 bg-indigo-500' : 'bg-gray-400'}`}
              ></div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">Highlight Connections</label>
            <div className="relative inline-block w-12 align-middle select-none">
              <input
                type="checkbox"
                id="highlightConnections"
                name="highlightConnections"
                className="sr-only"
                checked={settings.highlightConnections}
                onChange={() => setSettings({ ...settings, highlightConnections: !settings.highlightConnections })}
              />
              <div className="block h-6 bg-slate-700 rounded-full w-12"></div>
              <div
                className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform ${settings.highlightConnections ? 'transform translate-x-6 bg-indigo-500' : 'bg-gray-400'}`}
              ></div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Animation Speed</label>
            <div className="flex space-x-2">
              {['slow', 'medium', 'fast'].map(speed => (<button
                  key={speed}
                  className={`flex-1 py-2 px-3 rounded-md text-sm ${settings.animationSpeed === speed ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
                  onClick={() => setSettings({ ...settings, animationSpeed: speed })}
                >
                  {speed.charAt(0).toUpperCase() + speed.slice(1)}
                </button>))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Node Size</label>
            <div className="flex space-x-2">
              {['small', 'medium', 'large'].map(size => (<button
                  key={size}
                  className={`flex-1 py-2 px-3 rounded-md text-sm ${settings.nodeSize === size ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
                  onClick={() => setSettings({ ...settings, nodeSize: size })}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </button>))}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button variant="primary" onClick={() => setSettingsModalOpen(false)} icon={<FaSave />}>
              Save Settings
            </Button>
          </div>
        </div>
      </Modal>

      {/* Help Modal */}
      <Modal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        title="Keyboard Shortcuts & Help"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-md font-semibold text-indigo-400 mb-2">Keyboard Shortcuts</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-slate-900 p-2 rounded">
                <span className="inline-block bg-slate-700 px-2 py-1 rounded mr-2 text-xs font-mono">
                  n
                </span>
                Add new person
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <span className="inline-block bg-slate-700 px-2 py-1 rounded mr-2 text-xs font-mono">
                  r
                </span>
                Add new relationship
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <span className="inline-block bg-slate-700 px-2 py-1 rounded mr-2 text-xs font-mono">
                  s
                </span>
                Toggle sidebar
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <span className="inline-block bg-slate-700 px-2 py-1 rounded mr-2 text-xs font-mono">
                  +
                </span>
                Zoom in
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <span className="inline-block bg-slate-700 px-2 py-1 rounded mr-2 text-xs font-mono">
                  -
                </span>
                Zoom out
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <span className="inline-block bg-slate-700 px-2 py-1 rounded mr-2 text-xs font-mono">
                  0
                </span>
                Reset zoom
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <span className="inline-block bg-slate-700 px-2 py-1 rounded mr-2 text-xs font-mono">
                  Ctrl+/
                </span>
                Show this help
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-md font-semibold text-indigo-400 mb-2">Tips & Tricks</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start">
                <span className="text-indigo-400 mr-2">•</span>
                <span>
                  Click on a person in the graph to see their details and edit their information
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-400 mr-2">•</span>
                <span>Drag people around in the graph to organize your network visually</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-400 mr-2">•</span>
                <span>
                  Use the sidebar to filter and manage your network's people and relationships
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-400 mr-2">•</span>
                <span>
                  Create bidirectional relationships to show mutual connections (recommended)
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-400 mr-2">•</span>
                <span>Customize the appearance and behavior in Settings</span>
              </li>
            </ul>
          </div>

          <div className="text-center pt-2">
            <Button variant="primary" onClick={() => setHelpModalOpen(false)} icon={<FaStar />}>
              Got it
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        title="Confirm Deletion"
        message={itemToDelete.type === 'person' ? 'Are you sure you want to delete this person? This will also remove all their relationships.' : 'Are you sure you want to delete this relationship?'}
        confirmText="Delete"
        variant="danger"
      />

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-[9900] space-y-2 pointer-events-none">
        {toasts.map(toast => (<Toast
            key={toast.id}
            message={toast.message}
            type={toast.type as any}
            onClose={() => removeToast(toast.id)}
          />))}
      </div>
    </div>);
};

export default FriendshipNetwork;
