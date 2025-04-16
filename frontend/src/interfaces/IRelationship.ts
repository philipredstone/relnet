// Types
import { RELATIONSHIP_TYPES } from '../types/RelationShipTypes';

export interface Relationship {
  _id: string;
  source: string;
  target: string;
  type: RELATIONSHIP_TYPES;
  customType?: string;
  network: string;
  createdAt: string;
  updatedAt: string;
}