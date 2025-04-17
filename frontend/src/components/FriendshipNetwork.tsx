import React, { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFriendshipNetwork } from '../hooks/useFriendshipNetwork';
import { useNetworks } from '../context/NetworkContext';
import {
  FaArrowLeft,
  FaExclamationTriangle,
  FaInfo,
  FaTimes,
  FaUserFriends,
  FaUserPlus,
} from 'react-icons/fa';

import { Button, ConfirmDialog, Toast } from './FriendshipNetworkComponents';
import NetworkSidebar from './NetworkSidebar';
import CanvasGraph from './CanvasGraph';

import { getRelationshipColor } from '../types/RelationShipTypes';

import {
  PersonNode,
  RelationshipEdge,
  FormErrors,
  NewPersonForm,
  NewRelationshipForm,
  ToastItem,
} from '../types/network';

import {
  PersonFormModal,
  RelationshipFormModal,
  PersonDetailModal,
  SettingsModal,
  HelpModal,
} from './Modals';

import { LoadingSpinner } from '../components/UIComponents';

const DEFAULT_SETTINGS = {
  darkMode: true,
  autoLayout: true,
  showLabels: true,
  animationSpeed: 'medium',
  highlightConnections: true,
  nodeSize: 'medium',
};

export const useToastNotifications = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (message: string, type: 'error' | 'success' | 'warning' | 'info' = 'success') => {
      const id = Date.now();
      const newToast = {
        id,
        message,
        type,
        onClose: () => removeToast(id),
      };

      setToasts(prevToasts => [...prevToasts, newToast]);

      setTimeout(() => removeToast(id), 3000);
    },
    []
  );

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};

/**
 * Hook for managing graph container dimensions and handling resize events
 */
export const useGraphDimensions = (
  graphContainerRef: RefObject<HTMLDivElement>,
  sidebarOpen: boolean
) => {
  const [graphDimensions, setGraphDimensions] = useState({ width: 0, height: 0 });

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

  return graphDimensions;
};

/**
 * Hook for setting up keyboard shortcuts
 */
export const useKeyboardShortcuts = (handlers: {
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleResetZoom: () => void;
  toggleSidebar: () => void;
  setPersonModalOpen: (open: boolean) => void;
  setRelationshipModalOpen: (open: boolean) => void;
  setHelpModalOpen: (open: boolean) => void;
}) => {
  useEffect(() => {
    const {
      handleZoomIn,
      handleZoomOut,
      handleResetZoom,
      toggleSidebar,
      setPersonModalOpen,
      setRelationshipModalOpen,
      setHelpModalOpen,
    } = handlers;

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
  }, [handlers]);
};

/**
 * Hook to manage node positions in the graph
 */
export const useSmartNodePositioning = (
  graphWidth: number,
  graphHeight: number,
  peopleCount: number
) => {
  return useCallback(() => {
    const centerX = graphWidth / 2;
    const centerY = graphHeight / 2;
    const maxRadius = Math.min(graphWidth, graphHeight) * 0.4;
    const totalNodes = peopleCount;
    const index = totalNodes;

    if (totalNodes <= 0) {
      return { x: centerX, y: centerY };
    } else if (totalNodes <= 4) {
      const theta = index * 2.399;
      const radius = maxRadius * 0.5 * Math.sqrt(index / (totalNodes + 1));
      return {
        x: centerX + radius * Math.cos(theta),
        y: centerY + radius * Math.sin(theta),
      };
    } else if (totalNodes <= 11) {
      const isOuterRing = index >= Math.floor(totalNodes / 2);
      const ringIndex = isOuterRing ? index - Math.floor(totalNodes / 2) : index;
      const ringTotal = isOuterRing
        ? totalNodes - Math.floor(totalNodes / 2) + 1
        : Math.floor(totalNodes / 2);
      const ringRadius = isOuterRing ? maxRadius * 0.8 : maxRadius * 0.4;

      const angle = (ringIndex / ringTotal) * 2 * Math.PI + (isOuterRing ? 0 : Math.PI / ringTotal);
      return {
        x: centerX + ringRadius * Math.cos(angle),
        y: centerY + ringRadius * Math.sin(angle),
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
        x: clusterX + randomDistance * Math.cos(randomAngle),
        y: clusterY + randomDistance * Math.sin(randomAngle),
      };
    }
  }, [graphWidth, graphHeight, peopleCount]);
};

/**
 * Main FriendshipNetwork component
 */
const FriendshipNetwork: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { networks } = useNetworks();
  const navigate = useNavigate();
  const graphContainerRef = useRef<HTMLDivElement>(null);

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
    updatePersonPosition: updatePersonPositionImpl = (
      id: string,
      position: { x: number; y: number }
    ) => {
      console.warn('updatePersonPosition not implemented');
      return Promise.resolve();
    },
  } = useFriendshipNetwork(id || null) as any;

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('people');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [interactionHint, setInteractionHint] = useState(true);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  // Custom hooks
  const { toasts, addToast, removeToast } = useToastNotifications();
  const graphDimensions = useGraphDimensions(
    graphContainerRef as React.RefObject<HTMLDivElement>,
    sidebarOpen
  );
  const getSmartNodePosition = useSmartNodePositioning(
    graphDimensions.width,
    graphDimensions.height,
    people.length
  );

  // Modal states
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [relationshipModalOpen, setRelationshipModalOpen] = useState(false);
  const [personDetailModalOpen, setPersonDetailModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string }>({
    type: '',
    id: '',
  });

  // Form errors
  const [personFormErrors, setPersonFormErrors] = useState<FormErrors>({});
  const [relationshipFormErrors, setRelationshipFormErrors] = useState<FormErrors>({});

  // Form states
  const [newPerson, setNewPerson] = useState<NewPersonForm>({
    firstName: '',
    lastName: '',
    birthday: null,
    notes: '',
  });

  const [editPerson, setEditPerson] = useState<PersonNode | null>(null);

  const [newRelationship, setNewRelationship] = useState<NewRelationshipForm>({
    source: '',
    target: '',
    type: 'friend',
    customType: '',
    notes: '',
    bidirectional: true,
  });

  // Filter states
  const [peopleFilter, setPeopleFilter] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState('');
  const [relationshipTypeFilter, setRelationshipTypeFilter] = useState('all');

  // Settings state
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Get current network info
  const currentNetwork = networks.find(network => network._id === id);

  // Dismiss interaction hint after 10 seconds
  React.useEffect(() => {
    if (interactionHint) {
      const timer = setTimeout(() => {
        setInteractionHint(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [interactionHint]);

  // Register keyboard shortcuts
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => setZoomLevel(1);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useKeyboardShortcuts({
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    toggleSidebar,
    setPersonModalOpen,
    setRelationshipModalOpen,
    setHelpModalOpen,
  });

  // Transform API data to graph format
  const getGraphData = useCallback(() => {
    if (!people || !relationships) {
      return { nodes: [], edges: [], links: [] };
    }

    // Create nodes
    const graphNodes = people.map((person: PersonNode) => {
      const connectionCount = relationships.filter(
        (r: RelationshipEdge) => r.source === person._id || r.target === person._id
      ).length;

      // Determine if node should be highlighted
      const isSelected = person._id === selectedPersonId;
      const isConnected = selectedPersonId
        ? relationships.some(
            (r: RelationshipEdge) =>
              (r.source === selectedPersonId && r.target === person._id) ||
              (r.target === selectedPersonId && r.source === person._id)
          )
        : false;

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
    const graphEdges = relationships.map((rel: RelationshipEdge) => {
      const color = getRelationshipColor(rel.type);
      const width = rel.type === 'partner' ? 4 : rel.type === 'family' ? 3 : 2;

      // Highlight edges connected to selected node
      const isHighlighted =
        selectedPersonId &&
        settings.highlightConnections &&
        (rel.source === selectedPersonId || rel.target === selectedPersonId);

      return {
        id: rel._id,
        source: rel.source,
        target: rel.target,
        color: isHighlighted ? '#F472B6' : color, // Pink color for highlighted edges
        width: isHighlighted ? width + 1 : width, // Slightly thicker for highlighted
        type: rel.type,
        customType: rel.customType,
      };
    });

    // For compatibility with CustomGraphData
    return {
      nodes: graphNodes,
      edges: graphEdges,
      links: graphEdges, // Duplicate edges as links for compatibility
    };
  }, [people, relationships, settings.showLabels, settings.highlightConnections, selectedPersonId]);

  // Form validation functions
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
      const existingRelationship = relationships.find(
        (r: RelationshipEdge) =>
          (r.source === relationship.source && r.target === relationship.target) ||
          (relationship.bidirectional &&
            r.source === relationship.target &&
            r.target === relationship.source)
      );

      if (existingRelationship) {
        errors.general = 'This relationship already exists';
      }
    }

    return errors;
  };

  // Event handlers
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
      firstName: '',
      lastName: '',
      birthday: null,
      notes: '',
    });

    setPersonModalOpen(false);
    addToast('Person added successfully');
  };

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

  const handleRelationshipSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateRelationshipForm(newRelationship);
    setRelationshipFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    const { source, target, type, customType, notes, bidirectional } = newRelationship;

    // Create the relationship
    createRelationship({
      source,
      target,
      type,
      customType: type === 'custom' ? customType : undefined,
      notes,
    });

    // Create bidirectional relationship if selected
    if (bidirectional && source !== target) {
      createRelationship({
        source: target,
        target: source,
        type,
        customType: type === 'custom' ? customType : undefined,
        notes,
      });
    }

    // Reset form and close modal
    setNewRelationship({
      source: '',
      target: '',
      type: 'friend',
      customType: '',
      notes: '',
      bidirectional: true,
    });

    setRelationshipModalOpen(false);
    addToast(`Relationship${bidirectional ? 's' : ''} created successfully`);
  };

  // Common actions
  const confirmDelete = (type: string, id: string) => {
    setItemToDelete({ type, id });
    setDeleteConfirmOpen(true);
  };

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

  const openPersonDetail = (person: PersonNode) => {
    setEditPerson({ ...person });
    setPersonDetailModalOpen(true);
  };

  const handleRefreshNetwork = () => {
    refreshNetwork();
    addToast('Network refreshed');
  };

  const handleNodeClick = (nodeId: string) => {
    // Toggle selection
    if (selectedPersonId === nodeId) {
      setSelectedPersonId(null);
    } else {
      setSelectedPersonId(nodeId);
    }

    // Open person details
    const person = people.find((p: PersonNode) => p._id === nodeId);
    if (person) {
      openPersonDetail(person);
    }
  };

  // Sort people alphabetically
  const sortedPeople = [...people].sort((a: PersonNode, b: PersonNode) => {
    const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
    const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-900">
        <LoadingSpinner message="Loading your network..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-900">
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
      </div>
    );
  }

  // Generate graph data
  const graphData = getGraphData();

  return (
    <div className="flex h-full h-full-important bg-slate-900 text-white overflow-hidden">
      {/* Network Sidebar Component */}
      <NetworkSidebar
        isOpen={sidebarOpen}
        currentNetwork={currentNetwork}
        sidebarTab={sidebarTab}
        people={people}
        relationships={relationships}
        selectedPersonId={selectedPersonId}
        peopleFilter={peopleFilter}
        relationshipFilter={relationshipFilter}
        relationshipTypeFilter={relationshipTypeFilter}
        onTabChange={setSidebarTab}
        onPeopleFilterChange={setPeopleFilter}
        onRelationshipFilterChange={setRelationshipFilter}
        onRelationshipTypeFilterChange={setRelationshipTypeFilter}
        onAddPerson={() => setPersonModalOpen(true)}
        onAddRelationship={() => setRelationshipModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenHelp={() => setHelpModalOpen(true)}
        onPersonDelete={id => confirmDelete('person', id)}
        onRelationshipDelete={id => confirmDelete('relationship', id)}
        onOpenPersonDetail={person => {
          openPersonDetail(person);
          setSelectedPersonId(person._id);
        }}
        onNavigateBack={() => navigate('/networks')}
      />

      {/* Main Graph Area */}
      <div ref={graphContainerRef} className="flex-1 bg-slate-900 relative overflow-hidden">
        {graphDimensions.width <= 0 || graphDimensions.height <= 0 ? (
          <div className="w-full h-full flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <CanvasGraph
            data={graphData}
            width={graphDimensions.width}
            height={graphDimensions.height}
          />
        )}

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
          </div>
        )}

        {/* Interaction hint */}
        {people.length > 0 && interactionHint && (
          <div
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
          </div>
        )}

        {/* Quick action buttons */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
          <div
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-colors cursor-pointer"
            onClick={() => setPersonModalOpen(true)}
            title="Add Person (shortcut: n)"
          >
            <FaUserPlus />
          </div>
          <div
            className="bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-full shadow-lg transition-colors cursor-pointer"
            onClick={() => setRelationshipModalOpen(true)}
            title="Add Relationship (shortcut: r)"
          >
            <FaUserFriends />
          </div>
        </div>
      </div>

      {/* Modals */}
      <PersonFormModal
        isOpen={personModalOpen}
        onClose={() => {
          setPersonModalOpen(false);
          setPersonFormErrors({});
        }}
        formData={newPerson}
        setFormData={setNewPerson}
        errors={personFormErrors}
        onSubmit={handlePersonSubmit}
        isEdit={false}
      />

      <RelationshipFormModal
        isOpen={relationshipModalOpen}
        onClose={() => {
          setRelationshipModalOpen(false);
          setRelationshipFormErrors({});
        }}
        formData={newRelationship}
        setFormData={setNewRelationship}
        errors={relationshipFormErrors}
        onSubmit={handleRelationshipSubmit}
        people={sortedPeople}
      />

      {editPerson && (
        <PersonDetailModal
          isOpen={personDetailModalOpen}
          onClose={() => {
            setPersonDetailModalOpen(false);
            setEditPerson(null);
            setPersonFormErrors({});
          }}
          person={editPerson}
          setPerson={setEditPerson}
          errors={personFormErrors}
          onSubmit={handleUpdatePerson}
          onDelete={id => {
            confirmDelete('person', id);
            setPersonDetailModalOpen(false);
          }}
          relationships={relationships}
          people={people}
          onDeleteRelationship={deleteRelationship}
          onAddNewConnection={() => {
            setNewRelationship({
              ...newRelationship,
              source: editPerson._id,
            });
            setPersonDetailModalOpen(false);
            setTimeout(() => setRelationshipModalOpen(true), 100);
          }}
          onNavigateToPerson={personId => {
            setSelectedPersonId(personId);
            setPersonDetailModalOpen(false);
            setTimeout(() => {
              const targetPerson = people.find((p: PersonNode) => p._id === personId);
              if (targetPerson) openPersonDetail(targetPerson);
            }, 100);
          }}
        />
      )}

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        setSettings={setSettings}
      />

      <HelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        title="Confirm Deletion"
        message={
          itemToDelete.type === 'person'
            ? 'Are you sure you want to delete this person? This will also remove all their relationships.'
            : 'Are you sure you want to delete this relationship?'
        }
        confirmText="Delete"
        variant="danger"
      />

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-[9900] space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type as any}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default FriendshipNetwork;
