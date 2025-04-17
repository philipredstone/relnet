import React from 'react';
import {
  FaEdit,
  FaHome,
  FaSearch,
  FaTrash,
  FaUserCircle,
  FaUserFriends,
  FaUserPlus,
} from 'react-icons/fa';

// Import custom UI components
import { Button, EmptyState, Tooltip, NetworkStats } from './FriendshipNetworkComponents';

// Types
type RelationshipType = 'freund' | 'partner' | 'familie' | 'arbeitskolleg' | 'custom';

interface PersonNode {
  _id: string;
  firstName: string;
  lastName: string;
  birthday?: Date | string | null;
  notes?: string;
  position?: {
    x: number;
    y: number;
  };
}

interface RelationshipEdge {
  _id: string;
  source: string;
  target: string;
  type: RelationshipType;
  customType?: string;
  notes?: string;
}

// Graph appearance constants
const RELATIONSHIP_COLORS = {
  freund: '#60A5FA', // Light blue
  partner: '#F472B6', // Pink
  familie: '#34D399', // Green
  arbeitskolleg: '#FBBF24', // Yellow
  custom: '#9CA3AF', // Gray
};

const RELATIONSHIP_LABELS = {
  freund: 'Friend',
  partner: 'Partner',
  familie: 'Family',
  arbeitskolleg: 'Colleague',
  custom: 'Custom',
};

// NetworkSidebar component props
interface NetworkSidebarProps {
  isOpen: boolean;
  currentNetwork: any;
  sidebarTab: string;
  people: PersonNode[];
  relationships: RelationshipEdge[];
  selectedPersonId: string | null;
  peopleFilter: string;
  relationshipFilter: string;
  relationshipTypeFilter: string;

  onTabChange: (tab: string) => void;
  onPeopleFilterChange: (filter: string) => void;
  onRelationshipFilterChange: (filter: string) => void;
  onRelationshipTypeFilterChange: (type: string) => void;
  onAddPerson: () => void;
  onAddRelationship: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onPersonDelete: (id: string) => void;
  onRelationshipDelete: (id: string) => void;
  onOpenPersonDetail: (person: PersonNode) => void;
  onNavigateBack: () => void;
}

const NetworkSidebar: React.FC<NetworkSidebarProps> = ({
  isOpen,
  currentNetwork,
  sidebarTab,
  people,
  relationships,
  selectedPersonId,
  peopleFilter,
  relationshipFilter,
  relationshipTypeFilter,

  onTabChange,
  onPeopleFilterChange,
  onRelationshipFilterChange,
  onRelationshipTypeFilterChange,
  onAddPerson,
  onAddRelationship,
  onPersonDelete,
  onRelationshipDelete,
  onOpenPersonDetail,
  onNavigateBack,
}) => {
  // Filter logic for people and relationships
  const filteredPeople = people.filter(person =>
    `${person.firstName} ${person.lastName}`.toLowerCase().includes(peopleFilter.toLowerCase())
  );

  const filteredRelationships = relationships.filter(rel => {
    const source = people.find(p => p._id === rel.source);
    const target = people.find(p => p._id === rel.target);

    if (!source || !target) return false;

    const matchesFilter =
      `${source.firstName} ${source.lastName} ${target.firstName} ${target.lastName}`
        .toLowerCase()
        .includes(relationshipFilter.toLowerCase());

    const matchesType = relationshipTypeFilter === 'all' || rel.type === relationshipTypeFilter;

    return matchesFilter && matchesType;
  });

  // Sort people alphabetically
  const sortedPeople = [...filteredPeople].sort((a, b) => {
    const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
    const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return (
    <div
      className={`bg-slate-800 border-r border-slate-700 h-full transition-all duration-300 
      ease-in-out z-30 ${isOpen ? 'w-100' : 'w-0'}`}
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
                onClick={onNavigateBack}
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
          <Button variant="primary" fullWidth onClick={onAddPerson} icon={<FaUserPlus />}>
            Add Person
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={onAddRelationship}
            icon={<FaUserFriends />}
          >
            Add Relation
          </Button>
        </div>

        {/* Sidebar Tabs */}
        <div className="flex border-b border-slate-700 mb-4">
          <button
            className={`flex-1 py-2 font-medium flex items-center justify-center ${
              sidebarTab === 'people'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
            onClick={() => onTabChange('people')}
          >
            <FaUserCircle className="mr-2" /> People
          </button>
          <button
            className={`flex-1 py-2 font-medium flex items-center justify-center ${
              sidebarTab === 'relations'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
            onClick={() => onTabChange('relations')}
          >
            <FaUserFriends className="mr-2" /> Relations
          </button>
        </div>

        {/* Tab Content */}

        {sidebarTab === 'people' && (
          <div>
            <div className="flex items-center mb-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 pl-8 pr-3
                      text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  placeholder="Search people..."
                  value={peopleFilter}
                  onChange={e => onPeopleFilterChange(e.target.value)}
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto pr-1">
              {sortedPeople.length > 0 ? (
                sortedPeople.map(person => {
                  const connectionCount = relationships.filter(
                    r => r.source === person._id || r.target === person._id
                  ).length;

                  return (
                    <div
                      key={person._id}
                      className={`bg-slate-700 rounded-lg p-3 group hover:bg-slate-600 transition-colors 
                        cursor-pointer border-l-4 ${
                          selectedPersonId === person._id
                            ? 'border-l-pink-500'
                            : connectionCount > 0
                              ? 'border-l-indigo-500'
                              : 'border-l-slate-700'
                        }`}
                      onClick={() => {
                        onOpenPersonDetail(person);
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
                                onOpenPersonDetail(person);
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
                                onPersonDelete(person._id);
                              }}
                            >
                              <FaTrash size={14} />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  title={peopleFilter ? 'No matches found' : 'No people yet'}
                  description={
                    peopleFilter
                      ? 'Try adjusting your search criteria'
                      : 'Add people to start building your network'
                  }
                  icon={<FaUserCircle className="text-2xl text-slate-400" />}
                  action={
                    !peopleFilter && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={onAddPerson}
                        icon={<FaUserPlus />}
                      >
                        Add Person
                      </Button>
                    )
                  }
                />
              )}
            </div>
          </div>
        )}

        {sidebarTab === 'relations' && (
          <div>
            <div className="flex items-center mb-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 pl-8 pr-3
                      text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  placeholder="Search relationships..."
                  value={relationshipFilter}
                  onChange={e => onRelationshipFilterChange(e.target.value)}
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="flex mb-3 overflow-x-auto pb-2 space-x-1">
              <button
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${
                  relationshipTypeFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                onClick={() => onRelationshipTypeFilterChange('all')}
              >
                All Types
              </button>
              {Object.entries(RELATIONSHIP_COLORS).map(([type, color]) => (
                <button
                  key={type}
                  className={`px-3 py-1 text-xs rounded-full whitespace-nowrap flex items-center ${
                    relationshipTypeFilter === type
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                  onClick={() => onRelationshipTypeFilterChange(type as RelationshipType)}
                >
                  <span
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: color }}
                  ></span>
                  <span className="capitalize">
                    {RELATIONSHIP_LABELS[type as RelationshipType]}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-[calc(100vh-390px)] overflow-y-auto pr-1">
              {filteredRelationships.length > 0 ? (
                filteredRelationships.map(rel => {
                  const source = people.find(p => p._id === rel.source);
                  const target = people.find(p => p._id === rel.target);
                  if (!source || !target) return null;

                  return (
                    <div
                      key={rel._id}
                      className={`bg-slate-700 rounded-lg p-3 group hover:bg-slate-600 transition-colors 
                        border-l-4 ${
                          selectedPersonId === rel.source || selectedPersonId === rel.target
                            ? 'border-l-pink-500'
                            : 'border-l-slate-700'
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center">
                            <span
                              className={`font-medium ${selectedPersonId === rel.source ? 'text-pink-400' : ''}`}
                              onClick={e => {
                                e.stopPropagation();
                                const sourcePerson = people.find(p => p._id === rel.source);
                                if (sourcePerson) onOpenPersonDetail(sourcePerson);
                              }}
                            >
                              {source.firstName} {source.lastName}
                            </span>
                            <span className="mx-2 text-slate-400">→</span>
                            <span
                              className={`font-medium ${selectedPersonId === rel.target ? 'text-pink-400' : ''}`}
                              onClick={e => {
                                e.stopPropagation();
                                const targetPerson = people.find(p => p._id === rel.target);
                                if (targetPerson) onOpenPersonDetail(targetPerson);
                              }}
                            >
                              {target.firstName} {target.lastName}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-slate-400 mt-1">
                            <span
                              className="inline-block w-2 h-2 rounded-full mr-1"
                              style={{ backgroundColor: RELATIONSHIP_COLORS[rel.type] }}
                            ></span>
                            <span className="capitalize">
                              {rel.type === 'custom'
                                ? rel.customType
                                : RELATIONSHIP_LABELS[rel.type]}
                            </span>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip text="Delete">
                            <button
                              className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                              onClick={() => onRelationshipDelete(rel._id)}
                            >
                              <FaTrash size={14} />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  title={
                    relationshipFilter || relationshipTypeFilter !== 'all'
                      ? 'No matches found'
                      : 'No relationships yet'
                  }
                  description={
                    relationshipFilter || relationshipTypeFilter !== 'all'
                      ? 'Try adjusting your search criteria'
                      : 'Create relationships between people to visualize connections'
                  }
                  icon={<FaUserFriends className="text-2xl text-slate-400" />}
                  action={
                    !relationshipFilter &&
                    relationshipTypeFilter === 'all' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={onAddRelationship}
                        icon={<FaUserFriends />}
                      >
                        Add Relationship
                      </Button>
                    )
                  }
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkSidebar;
