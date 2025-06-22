import { z } from 'zod';

export interface FormValidationConfig {
    type: string;
    required?: boolean;
    optional?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    positive?: boolean;
    negative?: boolean;
    int?: boolean;
    finite?: boolean;
    email?: boolean;
    url?: boolean;
    uuid?: boolean;
    regex?: string;
    startsWith?: string;
    endsWith?: string;
    includes?: string;
    minDate?: string;
    maxDate?: string;
    customMessage?: string;
}

export interface FormSchemaConfig {
    [fieldName: string]: FormValidationConfig;
}

export class ZodSchemaGenerator {
    /**
     * Generate a Zod schema from form validation configuration
     */
    static generateSchema(config: FormSchemaConfig): z.ZodObject<any> {
        const schemaShape: Record<string, z.ZodTypeAny> = {};

        Object.entries(config).forEach(([fieldName, fieldConfig]) => {
            schemaShape[fieldName] = this.generateFieldSchema(fieldConfig);
        });

        return z.object(schemaShape);
    }

    /**
     * Generate a Zod schema for a single field
     */
    static generateFieldSchema(config: FormValidationConfig): z.ZodTypeAny {
        let schema = this.getBaseSchema(config.type);

        // Apply validations based on configuration
        schema = this.applyValidations(schema, config);

        return schema;
    }

    /**
     * Get the base Zod schema based on field type
     */
    private static getBaseSchema(type: string): z.ZodTypeAny {
        switch (type.toLowerCase()) {
            case 'string':
            case 'text':
            case 'textarea':
            case 'password':
            case 'email':
                return z.string();
            case 'number':
            case 'integer':
            case 'long':
            case 'double':
            case 'float':
                return z.number();
            case 'boolean':
                return z.boolean();
            case 'date':
            case 'datetime':
            case 'time':
                return z.date();
            case 'array':
                return z.array(z.any());
            default:
                return z.string();
        }
    }

    /**
     * Apply validations to a Zod schema
     */
    private static applyValidations(schema: z.ZodTypeAny, config: FormValidationConfig): z.ZodTypeAny {
        let result = schema;

        // Handle optional/required
        if (config.optional) {
            result = result.optional();
        }

        // Apply type-specific validations
        if (this.isNumberType(config.type)) {
            result = this.applyNumberValidations(result, config);
        } else if (this.isStringType(config.type)) {
            result = this.applyStringValidations(result, config);
        } else if (this.isDateType(config.type)) {
            result = this.applyDateValidations(result, config);
        }

        return result;
    }

    /**
     * Apply number-specific validations
     */
    private static applyNumberValidations(schema: z.ZodTypeAny, config: FormValidationConfig): z.ZodTypeAny {
        let result = schema;

        if (config.min !== undefined) {
            result = result.min(config.min, config.customMessage);
        }
        if (config.max !== undefined) {
            result = result.max(config.max, config.customMessage);
        }
        if (config.positive) {
            result = result.positive(config.customMessage);
        }
        if (config.negative) {
            result = result.negative(config.customMessage);
        }
        if (config.int) {
            result = result.int(config.customMessage);
        }
        if (config.finite) {
            result = result.finite(config.customMessage);
        }

        return result;
    }

    /**
     * Apply string-specific validations
     */
    private static applyStringValidations(schema: z.ZodTypeAny, config: FormValidationConfig): z.ZodTypeAny {
        let result = schema;

        if (config.minLength !== undefined) {
            result = result.min(config.minLength, config.customMessage);
        }
        if (config.maxLength !== undefined) {
            result = result.max(config.maxLength, config.customMessage);
        }
        if (config.email) {
            result = result.email(config.customMessage);
        }
        if (config.url) {
            result = result.url(config.customMessage);
        }
        if (config.uuid) {
            result = result.uuid(config.customMessage);
        }
        if (config.regex) {
            const regex = new RegExp(config.regex);
            result = result.regex(regex, config.customMessage);
        }
        if (config.startsWith) {
            result = result.startsWith(config.startsWith, config.customMessage);
        }
        if (config.endsWith) {
            result = result.endsWith(config.endsWith, config.customMessage);
        }
        if (config.includes) {
            result = result.includes(config.includes, config.customMessage);
        }

        return result;
    }

    /**
     * Apply date-specific validations
     */
    private static applyDateValidations(schema: z.ZodTypeAny, config: FormValidationConfig): z.ZodTypeAny {
        let result = schema;

        if (config.minDate) {
            result = result.min(new Date(config.minDate), config.customMessage);
        }
        if (config.maxDate) {
            result = result.max(new Date(config.maxDate), config.customMessage);
        }

        return result;
    }

    /**
     * Check if type is a number type
     */
    private static isNumberType(type: string): boolean {
        return ['number', 'integer', 'long', 'double', 'float'].includes(type.toLowerCase());
    }

    /**
     * Check if type is a string type
     */
    private static isStringType(type: string): boolean {
        return ['string', 'text', 'textarea', 'password', 'email'].includes(type.toLowerCase());
    }

    /**
     * Check if type is a date type
     */
    private static isDateType(type: string): boolean {
        return ['date', 'datetime', 'time'].includes(type.toLowerCase());
    }

    /**
     * Generate TypeScript interface from form configuration
     */
    static generateTypeScriptInterface(config: FormSchemaConfig, interfaceName: string = 'FormData'): string {
        const lines: string[] = [`interface ${interfaceName} {`];

        Object.entries(config).forEach(([fieldName, fieldConfig]) => {
            const type = this.getTypeScriptType(fieldConfig.type);
            const optional = fieldConfig.optional ? '?' : '';
            lines.push(`  ${fieldName}${optional}: ${type};`);
        });

        lines.push('}');
        return lines.join('\n');
    }

    /**
     * Get TypeScript type from field configuration
     */
    private static getTypeScriptType(type: string): string {
        switch (type.toLowerCase()) {
            case 'string':
            case 'text':
            case 'textarea':
            case 'password':
            case 'email':
                return 'string';
            case 'number':
            case 'integer':
            case 'long':
            case 'double':
            case 'float':
                return 'number';
            case 'boolean':
                return 'boolean';
            case 'date':
            case 'datetime':
            case 'time':
                return 'Date';
            case 'array':
                return 'any[]';
            default:
                return 'string';
        }
    }

    /**
     * Generate complete form validation code with imports
     */
    static generateCompleteCode(config: FormSchemaConfig, schemaName: string = 'formSchema'): string {
        const schemaCode = this.generateSchema(config).toString();
        const interfaceCode = this.generateTypeScriptInterface(config);
        
        return `import { z } from 'zod';

${interfaceCode}

export const ${schemaName} = ${schemaCode};

export type FormData = z.infer<typeof ${schemaName}>;`;
    }

    /**
     * Validate form data against generated schema
     */
    static validateFormData(schema: z.ZodObject<any>, data: any): { success: boolean; errors?: any } {
        try {
            schema.parse(data);
            return { success: true };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return { success: false, errors: error.errors };
            }
            throw error;
        }
    }
} 