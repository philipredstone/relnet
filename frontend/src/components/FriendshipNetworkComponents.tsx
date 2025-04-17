import React, { useEffect, useState } from 'react';
import { Transition } from '@headlessui/react';
import { FaTimes } from 'react-icons/fa';

// Define types
export interface TooltipProps {
  children: React.ReactNode;
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export interface ToastItem extends ToastProps {
  id: number;
}

export interface NetworkStatsProps {
  people: any[];
  relationships: any[];
}

// Enhanced Tooltip with animation and positioning
export const Tooltip: React.FC<TooltipProps> = ({
  children,
  text,
  position = 'top',
  delay = 300,
}) => {
  const [show, setShow] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutId) clearTimeout(timeoutId);
    const id = setTimeout(() => setShow(true), delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId);
    const id = setTimeout(() => setShow(false), 100);
    setTimeoutId(id);
  };

  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  const positionClasses = {
    top: '-top-8 left-1/2 transform -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 transform -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 transform -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 transform -translate-y-1/2',
  };

  const arrowClasses = {
    top: 'absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2',
    bottom: 'absolute w-2 h-2 bg-gray-900 transform rotate-45 -top-1 left-1/2 -translate-x-1/2',
    left: 'absolute w-2 h-2 bg-gray-900 transform rotate-45 right-0 top-1/2 -translate-y-1/2 -mr-1',
    right: 'absolute w-2 h-2 bg-gray-900 transform rotate-45 left-0 top-1/2 -translate-y-1/2 -ml-1',
  };

  return (
    <div className="relative inline-block">
      <div
        className="inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
      >
        {children}
      </div>

      <Transition
        show={show}
        enter="transition duration-200 ease-out"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition duration-150 ease-in"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div
          className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md shadow-lg 
          whitespace-nowrap max-w-xs ${positionClasses[position]}`}
        >
          {text}
          <div className={arrowClasses[position]}></div>
        </div>
      </Transition>
    </div>
  );
};

// Enhanced Modal with animations and responsive design
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  // Close on escape key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto pointer-events-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      style={{ isolation: 'isolate' }}
    >
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <Transition
          show={isOpen}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75 z-[9998]"
            aria-hidden="true"
            onClick={onClose}
          ></div>
        </Transition>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <Transition
          show={isOpen}
          enter="ease-out duration-300"
          enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enterTo="opacity-100 translate-y-0 sm:scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 translate-y-0 sm:scale-100"
          leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <div
            className={`relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom 
            bg-slate-800 rounded-lg shadow-xl transform transition-all sm:my-8 sm:align-middle sm:p-6 
            ${sizeClasses[size]} z-[10000] pointer-events-auto`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-indigo-400" id="modal-title">
                {title}
              </h3>
              <button
                type="button"
                className="p-1 text-gray-400 bg-slate-700 rounded-full hover:text-white focus:outline-none 
                focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div>{children}</div>
          </div>
        </Transition>
      </div>
    </div>
  );
};

// Enhanced Confirmation dialog
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}) => {
  const variantClasses = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="mt-2">
        <p className="text-sm text-gray-300">{message}</p>
      </div>

      <div className="mt-5 flex justify-end space-x-2">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-gray-300 bg-slate-700 rounded-md 
          hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 
          transition-colors"
          onClick={onClose}
        >
          {cancelText}
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium text-white rounded-md 
          focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${variantClasses[variant]}`}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};

// Enhanced Network statistics card
export const NetworkStats: React.FC<NetworkStatsProps> = ({ people, relationships }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Calculate statistics
  const avgConnections =
    people.length > 0 ? (relationships.length / people.length).toFixed(1) : '0.0';

  const isolatedPeople = people.filter(
    person => !relationships.some(r => r.source === person._id || r.target === person._id)
  ).length;

  // Find most connected person
  const personConnectionCounts = people.map(person => ({
    person,
    count: relationships.filter(r => r.source === person._id || r.target === person._id).length,
  }));

  const mostConnected =
    personConnectionCounts.length > 0
      ? personConnectionCounts.reduce((prev, current) =>
          prev.count > current.count ? prev : current
        )
      : null;

  return (
    <div className="bg-slate-800 rounded-lg p-4 shadow-md mb-4 transition-all duration-300">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-md font-semibold text-indigo-400">Network Statistics</h3>
        <button
          className="text-slate-400 hover:text-indigo-400 transition-colors text-sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide details' : 'Show details'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-slate-900 p-2 rounded transition-all duration-300 hover:bg-slate-800">
          <div className="text-2xl font-bold text-indigo-400">{people.length}</div>
          <div className="text-xs text-slate-400">People</div>
        </div>
        <div className="bg-slate-900 p-2 rounded transition-all duration-300 hover:bg-slate-800">
          <div className="text-2xl font-bold text-pink-400">{relationships.length}</div>
          <div className="text-xs text-slate-400">Relationships</div>
        </div>
      </div>

      <Transition
        show={showDetails}
        enter="transition-all duration-300 ease-out"
        enterFrom="opacity-0 max-h-0"
        enterTo="opacity-100 max-h-96"
        leave="transition-all duration-200 ease-in"
        leaveFrom="opacity-100 max-h-96"
        leaveTo="opacity-0 max-h-0"
      >
        <div className="overflow-hidden pt-2">
          <div className="grid grid-cols-2 gap-2 mt-2 text-center">
            <div className="bg-slate-900 p-2 rounded transition-all duration-300 hover:bg-slate-800">
              <div className="text-xl font-bold text-blue-400">{avgConnections}</div>
              <div className="text-xs text-slate-400">Avg. Connections</div>
            </div>
            <div className="bg-slate-900 p-2 rounded transition-all duration-300 hover:bg-slate-800">
              <div className="text-xl font-bold text-amber-400">{isolatedPeople}</div>
              <div className="text-xs text-slate-400">Isolated People</div>
            </div>
          </div>

          {mostConnected && mostConnected.count > 0 && (
            <div className="mt-2 bg-slate-900 p-2 rounded transition-all duration-300 hover:bg-slate-800">
              <div className="text-xs text-slate-400 mb-1">Most Connected</div>
              <div className="text-sm font-medium text-indigo-300">
                {mostConnected.person.firstName} {mostConnected.person.lastName}
              </div>
              <div className="text-xs text-slate-400">{mostConnected.count} connections</div>
            </div>
          )}
        </div>
      </Transition>
    </div>
  );
};

// Enhanced Toast notification component
export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  onClose,
  autoClose = true,
  duration = 3000,
}) => {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [onClose, autoClose, duration]);

  const typeStyles = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-amber-600',
    info: 'bg-blue-600',
  };

  const icon = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <Transition
      show={true}
      appear={true}
      enter="transform transition duration-300 ease-out"
      enterFrom="translate-y-2 opacity-0"
      enterTo="translate-y-0 opacity-100"
      leave="transform transition duration-200 ease-in"
      leaveFrom="translate-y-0 opacity-100"
      leaveTo="translate-y-2 opacity-0"
    >
      <div
        className={`${typeStyles[type]} text-white px-4 py-3 rounded-lg shadow-lg pointer-events-auto 
        flex items-center max-w-md`}
      >
        <span className="mr-2 font-bold">{icon[type]}</span>
        <span className="flex-1">{message}</span>
        <button
          onClick={onClose}
          className="ml-3 text-white opacity-70 hover:opacity-100 transition-opacity"
        >
          <FaTimes />
        </button>
      </div>
    </Transition>
  );
};

// Reusable Button component with variants
export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled = false,
  fullWidth = false,
}) => {
  const variantClasses = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white focus:ring-slate-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    outline:
      'bg-transparent border border-slate-600 text-slate-300 hover:bg-slate-800 focus:ring-slate-400',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <button
      type={type}
      className={`
        ${variantClasses[variant]} 
        ${sizeClasses[size]} 
        ${fullWidth ? 'w-full' : ''} 
        font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 
        transition-all duration-200 ease-in-out flex items-center justify-center
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className={`${children ? 'mr-2' : ''}`}>{icon}</span>}
      {children}
    </button>
  );
};

// FormField component for consistent form styling
export interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
  labelClassName?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  error,
  required = false,
  className = '',
  children,
  labelClassName = '',
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      <label
        htmlFor={id}
        className={`block text-sm font-medium text-gray-300 mb-1 ${labelClassName}`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

// Badge component for tags, status indicators, etc.
export interface BadgeProps {
  children: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, color = 'blue', className = '' }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${colorClasses[color]} ${className}
    `}
    >
      {children}
    </span>
  );
};

// Empty state component
export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, action }) => {
  return (
    <div className="text-center py-8">
      {icon && (
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-slate-800 rounded-full inline-flex">{icon}</div>
        </div>
      )}
      <h3 className="text-lg font-medium text-slate-300 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 mb-4 max-w-md mx-auto">{description}</p>
      {action}
    </div>
  );
};

// Card component
export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-slate-800 rounded-lg overflow-hidden shadow-md ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => {
  return <div className={`p-4 border-b border-slate-700 ${className}`}>{children}</div>;
};

export const CardBody: React.FC<CardProps> = ({ children, className = '' }) => {
  return <div className={`p-4 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<CardProps> = ({ children, className = '' }) => {
  return <div className={`p-4 border-t border-slate-700 ${className}`}>{children}</div>;
};
