export type SchemaType = 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean';

export interface SchemaField {
  name: string;
  type: SchemaType;
  description: string;
  properties?: Record<string, SchemaField>;
  required?: boolean;
  nullable?: boolean;
  deprecated?: boolean;
  enum?: (string | number)[];
  const?: string | number;
  format?: string;
  default?: any;
  examples?: any[];
  minimum?: number;
  maximum?: number;
  multipleOf?: number;
  title?: string;
}

export interface JSONSchema {
  type: 'object';
  properties: Record<string, SchemaField>;
}

