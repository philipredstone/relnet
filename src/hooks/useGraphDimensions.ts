import { useState, useEffect, useCallback, RefObject } from 'react';
import { ToastItem } from '../types/types';

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
