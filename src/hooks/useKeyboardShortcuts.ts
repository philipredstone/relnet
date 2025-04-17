import { useState, useEffect, useCallback, RefObject } from 'react';
import { ToastItem } from '../types/types';

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
