import { useState, useEffect, useCallback, RefObject } from 'react';
import { ToastItem } from '../types/types';

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
