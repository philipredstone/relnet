import React from 'react';
import DatePicker from 'react-datepicker';
import {
  FaPlus,
  FaRegCalendarAlt,
  FaSave,
  FaStar,
  FaTrash,
  FaUserFriends,
  FaUserPlus,
} from 'react-icons/fa';

import { Button, FormField, Modal } from '../components/FriendshipNetworkComponents';

import {
  PersonNode,
  RelationshipEdge,
  FormErrors,
  NewPersonForm,
  NewRelationshipForm,
} from '../types/network';

import {
  getRelationshipColor,
  getRelationshipLabel,
  RELATIONSHIP_TYPES,
  RELATIONSHIPS,
} from '../types/RelationShipTypes';
import {
  ErrorMessage,
  KeyboardShortcut,
  OptionGroup,
  TipItem,
  ToggleSetting,
} from './UIComponents';

// ==============================
// Person Form Modal
// ==============================
interface PersonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: NewPersonForm;
  setFormData: React.Dispatch<React.SetStateAction<NewPersonForm>>;
  errors: FormErrors;
  onSubmit: (e: React.FormEvent) => void;
  isEdit?: boolean;
}

export const PersonFormModal: React.FC<PersonFormModalProps> = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  errors,
  onSubmit,
  isEdit = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Person' : 'Add New Person'}>
      <form onSubmit={onSubmit} className="space-y-4">
        <ErrorMessage message={errors.general} />

        <FormField label="First Name" id="firstName" required error={errors.firstName}>
          <input
            id="firstName"
            type="text"
            className={`w-full bg-slate-700 border ${errors.firstName ? 'border-red-500' : 'border-slate-600'} 
            rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
            placeholder="Enter first name"
            value={formData.firstName}
            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
          />
        </FormField>

        <FormField label="Last Name" id="lastName" required error={errors.lastName}>
          <input
            id="lastName"
            type="text"
            className={`w-full bg-slate-700 border ${errors.lastName ? 'border-red-500' : 'border-slate-600'} 
            rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
            placeholder="Enter last name"
            value={formData.lastName}
            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
          />
        </FormField>

        <FormField label="Birthday (Optional)" id="birthday">
          <div className="relative">
            <DatePicker
              id="birthday"
              selected={formData.birthday}
              onChange={(date: Date | null) => setFormData({ ...formData, birthday: date })}
              dateFormat="dd.MM.YYYY"
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
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
          />
        </FormField>

        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={isEdit ? <FaSave /> : <FaUserPlus />}>
            {isEdit ? 'Save Changes' : 'Add Person'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ==============================
// Relationship Form Modal
// ==============================
interface RelationshipFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: NewRelationshipForm;
  setFormData: React.Dispatch<React.SetStateAction<NewRelationshipForm>>;
  errors: FormErrors;
  onSubmit: (e: React.FormEvent) => void;
  people: PersonNode[];
}

export const RelationshipFormModal: React.FC<RelationshipFormModalProps> = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  errors,
  onSubmit,
  people,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Relationship">
      <form onSubmit={onSubmit} className="space-y-4">
        <ErrorMessage message={errors.general} />

        <FormField label="Source Person" id="source" required error={errors.source}>
          <select
            id="source"
            className={`w-full bg-slate-700 border ${errors.source ? 'border-red-500' : 'border-slate-600'} 
            rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
            value={formData.source}
            onChange={e => setFormData({ ...formData, source: e.target.value })}
          >
            <option value="">Select person</option>
            {people.map(person => (
              <option key={`source-${person._id}`} value={person._id}>
                {person.firstName} {person.lastName}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Target Person" id="target" required error={errors.target}>
          <select
            id="target"
            className={`w-full bg-slate-700 border ${errors.target ? 'border-red-500' : 'border-slate-600'} 
            rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
            value={formData.target}
            onChange={e => setFormData({ ...formData, target: e.target.value })}
          >
            <option value="">Select person</option>
            {people.map(person => (
              <option key={`target-${person._id}`} value={person._id}>
                {person.firstName} {person.lastName}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Relationship Type" id="type" required>
          <select
            id="type"
            className="w-full bg-slate-700 border border-slate-600 rounded-md p-2
            focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
            value={formData.type}
            onChange={e =>
              setFormData({
                ...formData,
                type: e.target.value as RELATIONSHIP_TYPES,
              })
            }
          >
            {Object.entries(RELATIONSHIPS).map(([value, label]) => (
              <option key={value} value={value}>
                {label.label}
              </option>
            ))}
          </select>
        </FormField>

        {formData.type === 'custom' && (
          <FormField label="Custom Type" id="customType" required error={errors.customType}>
            <input
              id="customType"
              type="text"
              className={`w-full bg-slate-700 border ${errors.customType ? 'border-red-500' : 'border-slate-600'} 
              rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
              placeholder="Enter custom relationship type"
              value={formData.customType}
              onChange={e =>
                setFormData({
                  ...formData,
                  customType: e.target.value,
                })
              }
            />
          </FormField>
        )}

        <FormField label="Notes (Optional)" id="relationNotes">
          <textarea
            id="relationNotes"
            className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 min-h-[60px]
            focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
            placeholder="Add any additional information"
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
          />
        </FormField>

        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            id="bidirectional"
            className="h-4 w-4 rounded border-gray-500 text-indigo-600 focus:ring-indigo-500 bg-slate-700"
            checked={formData.bidirectional}
            onChange={e =>
              setFormData({
                ...formData,
                bidirectional: e.target.checked,
              })
            }
          />
          <label htmlFor="bidirectional" className="ml-2 block text-sm text-gray-300">
            Create bidirectional relationship (recommended)
          </label>
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={<FaUserFriends />}>
            Add Relationship
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ==============================
// Person Detail Modal
// ==============================
interface PersonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: PersonNode;
  setPerson: React.Dispatch<React.SetStateAction<PersonNode | null>>;
  errors: FormErrors;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: (id: string) => void;
  relationships: RelationshipEdge[];
  people: PersonNode[];
  onDeleteRelationship: (id: string) => void;
  onAddNewConnection: () => void;
  onNavigateToPerson: (id: string) => void;
}

export const PersonDetailModal: React.FC<PersonDetailModalProps> = ({
  isOpen,
  onClose,
  person,
  setPerson,
  errors,
  onSubmit,
  onDelete,
  relationships,
  people,
  onDeleteRelationship,
  onAddNewConnection,
  onNavigateToPerson,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${person.firstName} ${person.lastName}`}>
      <div className="space-y-6">
        <div className="space-y-4">
          <form onSubmit={onSubmit} className="space-y-4">
            <ErrorMessage message={errors.general} />

            <FormField label="First Name" id="editFirstName" required error={errors.firstName}>
              <input
                id="editFirstName"
                type="text"
                className={`w-full bg-slate-700 border ${errors.firstName ? 'border-red-500' : 'border-slate-600'} 
                rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                value={person.firstName || ''}
                onChange={e => setPerson({ ...person, firstName: e.target.value })}
              />
            </FormField>

            <FormField label="Last Name" id="editLastName" required error={errors.lastName}>
              <input
                id="editLastName"
                type="text"
                className={`w-full bg-slate-700 border ${errors.lastName ? 'border-red-500' : 'border-slate-600'} 
                rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                value={person.lastName || ''}
                onChange={e => setPerson({ ...person, lastName: e.target.value })}
              />
            </FormField>

            <FormField label="Birthday" id="editBirthday">
              <div className="relative">
                <DatePicker
                  id="editBirthday"
                  selected={person.birthday ? new Date(person.birthday) : null}
                  onChange={(date: Date | null) => setPerson({ ...person, birthday: date })}
                  dateFormat="dd.MM.YYYY"
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
                value={person.notes || ''}
                onChange={e => setPerson({ ...person, notes: e.target.value })}
              />
            </FormField>

            <div className="flex justify-between pt-2">
              <Button variant="danger" onClick={() => onDelete(person._id)} icon={<FaTrash />}>
                Delete
              </Button>

              <div className="flex space-x-2">
                <Button variant="secondary" onClick={onClose}>
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
            {relationships.filter(
              (r: RelationshipEdge) => r.source === person._id || r.target === person._id
            ).length > 0 ? (
              relationships
                .filter((r: RelationshipEdge) => r.source === person._id || r.target === person._id)
                .map((rel: RelationshipEdge) => {
                  const isSource = rel.source === person._id;
                  const otherPersonId = isSource ? rel.target : rel.source;
                  const otherPerson = people.find((p: PersonNode) => p._id === otherPersonId);

                  if (!otherPerson) return null;

                  return (
                    <div
                      key={rel._id}
                      className="flex justify-between items-center py-1 px-2 hover:bg-slate-800 rounded"
                    >
                      <div className="flex items-center">
                        <span
                          className="inline-block w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: getRelationshipColor(rel.type) }}
                        ></span>
                        <span className="text-sm">
                          {isSource ? 'To: ' : 'From: '}
                          <span
                            className="font-medium hover:text-indigo-400 cursor-pointer"
                            onClick={() => onNavigateToPerson(otherPersonId)}
                          >
                            {otherPerson.firstName} {otherPerson.lastName}
                          </span>
                          {rel.type === 'custom'
                            ? ` (${rel.customType})`
                            : ` (${getRelationshipLabel(rel.type)})`}
                        </span>
                      </div>
                      <button
                        className="text-red-400 hover:text-red-300 transition-colors"
                        onClick={() => onDeleteRelationship(rel._id)}
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  );
                })
            ) : (
              <div className="text-center py-2 text-slate-400 text-sm">No connections yet</div>
            )}
          </div>
          <div className="mt-3 flex justify-center">
            <Button variant="secondary" size="sm" onClick={onAddNewConnection} icon={<FaPlus />}>
              Add New Connection
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ==============================
// Settings Modal
// ==============================
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    darkMode: boolean;
    autoLayout: boolean;
    showLabels: boolean;
    animationSpeed: string;
    highlightConnections: boolean;
    nodeSize: string;
  };
  setSettings: React.Dispatch<
    React.SetStateAction<{
      darkMode: boolean;
      autoLayout: boolean;
      showLabels: boolean;
      animationSpeed: string;
      highlightConnections: boolean;
      nodeSize: string;
    }>
  >;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  setSettings,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Network Settings">
      <div className="space-y-4">
        {/* Toggle settings */}
        <ToggleSetting
          label="Show Labels"
          id="showLabels"
          checked={settings.showLabels}
          onChange={() => setSettings({ ...settings, showLabels: !settings.showLabels })}
        />

        <ToggleSetting
          label="Auto Layout"
          id="autoLayout"
          checked={settings.autoLayout}
          onChange={() => setSettings({ ...settings, autoLayout: !settings.autoLayout })}
        />

        <ToggleSetting
          label="Highlight Connections"
          id="highlightConnections"
          checked={settings.highlightConnections}
          onChange={() =>
            setSettings({
              ...settings,
              highlightConnections: !settings.highlightConnections,
            })
          }
        />

        {/* Option groups */}
        <OptionGroup
          label="Animation Speed"
          options={['slow', 'medium', 'fast']}
          currentValue={settings.animationSpeed}
          onChange={value => setSettings({ ...settings, animationSpeed: value })}
        />

        <OptionGroup
          label="Node Size"
          options={['small', 'medium', 'large']}
          currentValue={settings.nodeSize}
          onChange={value => setSettings({ ...settings, nodeSize: value })}
        />

        <div className="pt-4 flex justify-end">
          <Button variant="primary" onClick={onClose} icon={<FaSave />}>
            Save Settings
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ==============================
// Help Modal
// ==============================
interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts & Help" size="lg">
      <div className="space-y-6">
        <div>
          <h3 className="text-md font-semibold text-indigo-400 mb-2">Keyboard Shortcuts</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <KeyboardShortcut shortcut="n" description="Add new person" />
            <KeyboardShortcut shortcut="r" description="Add new relationship" />
            <KeyboardShortcut shortcut="s" description="Toggle sidebar" />
            <KeyboardShortcut shortcut="+" description="Zoom in" />
            <KeyboardShortcut shortcut="-" description="Zoom out" />
            <KeyboardShortcut shortcut="0" description="Reset zoom" />
            <KeyboardShortcut shortcut="Ctrl+/" description="Show this help" />
          </div>
        </div>

        <div>
          <h3 className="text-md font-semibold text-indigo-400 mb-2">Tips & Tricks</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <TipItem text="Click on a person in the graph to see their details and edit their information" />
            <TipItem text="Drag people around in the graph to organize your network visually" />
            <TipItem text="Use the sidebar to filter and manage your network's people and relationships" />
            <TipItem text="Create bidirectional relationships to show mutual connections (recommended)" />
            <TipItem text="Customize the appearance and behavior in Settings" />
          </ul>
        </div>

        <div className="text-center pt-2">
          <Button variant="primary" onClick={onClose} icon={<FaStar />}>
            Got it
          </Button>
        </div>
      </div>
    </Modal>
  );
};
