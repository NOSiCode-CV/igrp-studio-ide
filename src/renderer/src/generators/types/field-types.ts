export type FieldTypeValue =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "array"
  | "object"
  | "email"
  | "password"
  | "tel"
  | "url"
  | "color"
  | "file"

export interface FieldType {
  id: string
  name: string
  type: FieldTypeValue
  required: boolean
  validation?: string
  defaultValue?: string
  description?: string
  options?: string[]
  placeholder?: string
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  step?: number
  helpText?: string
  isMultiple?: boolean
}

export const VALIDATION_PATTERNS = {
  email: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
  url: "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)",
  phone: "^[0-9]{10,15}$",
  zipCode: "^[0-9]{5}(-[0-9]{4})?$",
  letters: "^[a-zA-Z]+$",
  alphanumeric: "^[a-zA-Z0-9]+$",
  numbers: "^[0-9]+$",
  decimal: "^[0-9]+(\\.[0-9]+)?$",
}
