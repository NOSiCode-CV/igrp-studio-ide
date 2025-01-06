import { SchemaType } from "@igrp/spring-engine/dist/interfaces/types";

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
  maxLength?: number;
  minLength?: number;
  multipleOf?: number;
  title?: string;
  pattern?: string;
}

export interface JSONSchema {
  type: 'object';
  properties: Record<string, SchemaField>;
}

