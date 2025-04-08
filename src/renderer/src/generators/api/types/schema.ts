export interface SchemaField {
  name: string;
  type: string;
  description?: string;
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
  maxLength?: number;
  minLength?: number;
  multipleOf?: number;
  title?: string;
  pattern?: string;
}

export interface JSONSchema {
  type: string;
  properties: Record<string, SchemaField>
  required?: string[];
}

