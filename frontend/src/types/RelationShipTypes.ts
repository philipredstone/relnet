export type RELATIONSHIP_TYPES =
  | 'acquaintance'
  | 'friend'
  | 'partner'
  | 'family'
  | 'secondDegree'
  | 'colleague'
  | 'teacher'
  | 'exPartner'
  | 'custom';

export const RELATIONSHIPS: Record<RELATIONSHIP_TYPES, { label: string; color: string }> = {
  acquaintance: { label: 'Bekannter', color: '#60A5FA' }, // Light blue
  friend: { label: 'Freund', color: '#60A5FA' }, // Light blue
  partner: { label: 'Partner', color: '#F472B6' }, // Pink
  family: { label: 'Familie', color: '#34D399' }, // Green
  secondDegree: { label: 'Verwandter', color: '#34D399' }, // Green
  colleague: { label: 'Kollege/Klassenkamerad', color: '#FBBF24' }, // Yellow
  teacher: { label: 'Lehrer', color: '#FBBF24' }, // Yellow
  exPartner: { label: 'Ex-Partner', color: '#ce8c13' }, // Orange
  custom: { label: 'Benutzerdefiniert', color: '#9CA3AF' }, // Gray
};
export const getRelationshipLabel = (type: RELATIONSHIP_TYPES): string => RELATIONSHIPS[type].label;
export const getRelationshipColor = (type: RELATIONSHIP_TYPES): string => RELATIONSHIPS[type].color;
