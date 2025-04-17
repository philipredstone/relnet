import React from 'react';
import { FormErrors } from '../types/network';

/**
 * Toggle setting component with a switch-style toggle
 */
export interface ToggleSettingProps {
  label: string;
  id: string;
  checked: boolean;
  onChange: () => void;
}

export const ToggleSetting: React.FC<ToggleSettingProps> = ({ label, id, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <div className="relative inline-block w-12 align-middle select-none">
        <input
          type="checkbox"
          id={id}
          name={id}
          className="sr-only"
          checked={checked}
          onChange={onChange}
        />
        <div className="block h-6 bg-slate-700 rounded-full w-12"></div>
        <div
          className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform ${
            checked ? 'transform translate-x-6 bg-indigo-500' : 'bg-gray-400'
          }`}
        ></div>
      </div>
    </div>
  );
};

/**
 * Option group component for selecting from a group of options
 */
export interface OptionGroupProps {
  label: string;
  options: string[];
  currentValue: string;
  onChange: (value: string) => void;
}

export const OptionGroup: React.FC<OptionGroupProps> = ({
  label,
  options,
  currentValue,
  onChange,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="flex space-x-2">
        {options.map(option => (
          <button
            key={option}
            className={`flex-1 py-2 px-3 rounded-md text-sm ${
              currentValue === option
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
            onClick={() => onChange(option)}
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * Keyboard shortcut item component for the help modal
 */
export interface KeyboardShortcutProps {
  shortcut: string;
  description: string;
}

export const KeyboardShortcut: React.FC<KeyboardShortcutProps> = ({ shortcut, description }) => {
  return (
    <div className="bg-slate-900 p-2 rounded">
      <span className="inline-block bg-slate-700 px-2 py-1 rounded mr-2 text-xs font-mono">
        {shortcut}
      </span>
      {description}
    </div>
  );
};

/**
 * Tip item component for the help modal
 */
export interface TipItemProps {
  text: string;
}

export const TipItem: React.FC<TipItemProps> = ({ text }) => {
  return (
    <li className="flex items-start">
      <span className="text-indigo-400 mr-2">•</span>
      <span>{text}</span>
    </li>
  );
};

/**
 * Error message display component
 */
export interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return message ? (
    <div className="bg-red-500/20 border border-red-500 text-white p-3 rounded-lg text-sm mb-4">
      {message}
    </div>
  ) : null;
};

/**
 * Loading spinner component
 */
export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 border-solid rounded-full animate-spin"></div>
      <p className="text-white text-lg">{message}</p>
    </div>
  );
};

/**
 * Form field group with validation
 */
export interface FormGroupProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  id,
  label,
  required = false,
  error,
  children,
}) => {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

/**
 * Form validation helpers
 */
export const validatePersonForm = (person: { firstName: string; lastName: string }): FormErrors => {
  const errors: FormErrors = {};

  if (!person.firstName.trim()) {
    errors.firstName = 'First name is required';
  }

  if (!person.lastName.trim()) {
    errors.lastName = 'Last name is required';
  }

  return errors;
};

export const validateRelationshipForm = (
  relationship: {
    source: string;
    target: string;
    type: string;
    customType: string;
    bidirectional: boolean;
  },
  existingRelationships: any[]
): FormErrors => {
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
    const existingRelationship = existingRelationships.find(
      r =>
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
