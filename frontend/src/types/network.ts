import { RELATIONSHIP_TYPES } from './RelationShipTypes';

export interface PersonNode {
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

export interface RelationshipEdge {
  _id: string;
  source: string;
  target: string;
  type: RELATIONSHIP_TYPES;
  customType?: string;
  notes?: string;
}

export interface GraphNode {
  id: string;
  firstName: string;
  lastName: string;
  connectionCount: number;
  bgColor: string;
  x: number;
  y: number;
  showLabel: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  color: string;
  width: number;
  type: RELATIONSHIP_TYPES;
  customType?: string;
}

export interface CanvasGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  links: GraphEdge[];
}

export interface FormErrors {
  [key: string]: string;
}

export interface NetworkSettings {
  darkMode: boolean;
  autoLayout: boolean;
  showLabels: boolean;
  animationSpeed: string;
  highlightConnections: boolean;
  nodeSize: string;
}

export interface NewPersonForm {
  firstName: string;
  lastName: string;
  birthday: Date | null;
  notes: string;
}

export interface NewRelationshipForm {
  source: string;
  target: string;
  type: RELATIONSHIP_TYPES;
  customType: string;
  notes: string;
  bidirectional: boolean;
}

export interface ToastItem {
  id: number;
  message: string;
  type: 'error' | 'success' | 'warning' | 'info';
  onClose: () => void;
}
