export interface PersonNode {
  _id: string;
  firstName: string;
  lastName: string;
  birthday?: Date | string | null;
  notes?: string;
  position?: {
    x: number; y: number;
  };
}

// Type for form errors
export interface FormErrors {
  [key: string]: string;
}