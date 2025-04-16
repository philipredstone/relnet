export type RELATIONSHIP_TYPES = 'freund' | 'partner' | 'familie' | 'arbeitskolleg' | 'custom';
export const RELATIONSHIP_LABELS = {
  freund: 'Friend', partner: 'Partner', familie: 'Family', arbeitskolleg: 'Colleague', custom: 'Custom',
}; // Graph appearance constants
export const RELATIONSHIP_COLORS = {
  freund: '#60A5FA', // Light blue
  partner: '#F472B6', // Pink
  familie: '#34D399', // Green
  arbeitskolleg: '#FBBF24', // Yellow
  custom: '#9CA3AF', // Gray
};