import { ZodSchemaGenerator, FormValidationConfig, FormSchemaConfig } from './zod-schema-generator';

/**
 * Examples of how to use the Form Validation System with Zod
 */

// Example 1: Basic form validation configuration
export const basicFormExample: FormSchemaConfig = {
    username: {
        type: 'string',
        required: true,
        minLength: 3,
        maxLength: 20,
        startsWith: 'user_',
    },
    email: {
        type: 'email',
        required: true,
        email: true,
    },
    age: {
        type: 'number',
        required: true,
        min: 18,
        max: 100,
        int: true,
    },
    password: {
        type: 'password',
        required: true,
        minLength: 8,
        regex: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)',
    },
    website: {
        type: 'url',
        optional: true,
        url: true,
    },
    birthDate: {
        type: 'date',
        required: true,
        maxDate: new Date().toISOString().split('T')[0], // Today
    },
    terms: {
        type: 'boolean',
        required: true,
    },
};

// Example 2: Advanced form with custom messages
export const advancedFormExample: FormSchemaConfig = {
    productName: {
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 100,
        customMessage: 'Product name must be between 2 and 100 characters',
    },
    price: {
        type: 'number',
        required: true,
        positive: true,
        finite: true,
        customMessage: 'Price must be a positive number',
    },
    sku: {
        type: 'string',
        required: true,
        regex: '^[A-Z]{2}-\\d{4}-[A-Z]{2}$',
        customMessage: 'SKU must follow pattern: XX-1234-XX',
    },
    description: {
        type: 'textarea',
        optional: true,
        maxLength: 500,
        customMessage: 'Description cannot exceed 500 characters',
    },
    category: {
        type: 'string',
        required: true,
        includes: 'electronics',
        customMessage: 'Category must include electronics',
    },
    tags: {
        type: 'array',
        optional: true,
    },
};

// Example 3: User registration form
export const userRegistrationExample: FormSchemaConfig = {
    firstName: {
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 50,
        customMessage: 'First name must be between 2 and 50 characters',
    },
    lastName: {
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 50,
        customMessage: 'Last name must be between 2 and 50 characters',
    },
    email: {
        type: 'email',
        required: true,
        email: true,
        customMessage: 'Please enter a valid email address',
    },
    phone: {
        type: 'tel',
        optional: true,
        regex: '^\\+?[1-9]\\d{1,14}$',
        customMessage: 'Please enter a valid phone number',
    },
    password: {
        type: 'password',
        required: true,
        minLength: 8,
        regex: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
        customMessage: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
    confirmPassword: {
        type: 'password',
        required: true,
        customMessage: 'Passwords must match',
    },
    dateOfBirth: {
        type: 'date',
        required: true,
        maxDate: new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 18 years ago
        customMessage: 'You must be at least 18 years old',
    },
    acceptTerms: {
        type: 'boolean',
        required: true,
        customMessage: 'You must accept the terms and conditions',
    },
};

/**
 * Usage Examples
 */

// Example: Generate Zod schema from form configuration
export const generateSchemaExample = () => {
    const schema = ZodSchemaGenerator.generateSchema(basicFormExample);
    console.log('Generated Zod Schema:', schema.toString());
    
    // Validate data
    const testData = {
        username: 'user_john',
        email: 'john@example.com',
        age: 25,
        password: 'Password123',
        website: 'https://example.com',
        birthDate: '1998-01-01',
        terms: true,
    };
    
    const validation = ZodSchemaGenerator.validateFormData(schema, testData);
    console.log('Validation result:', validation);
};

// Example: Generate complete TypeScript code
export const generateCompleteCodeExample = () => {
    const completeCode = ZodSchemaGenerator.generateCompleteCode(
        userRegistrationExample,
        'userRegistrationSchema'
    );
    console.log('Complete TypeScript code:', completeCode);
};

// Example: Form validation in React component
export const reactFormValidationExample = `
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodSchemaGenerator } from './zod-schema-generator';

const MyFormComponent = () => {
    // Generate schema from configuration
    const formConfig = {
        email: {
            type: 'email',
            required: true,
            email: true,
        },
        password: {
            type: 'password',
            required: true,
            minLength: 8,
        },
    };
    
    const schema = ZodSchemaGenerator.generateSchema(formConfig);
    
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(schema),
    });
    
    const onSubmit = (data) => {
        console.log('Form data:', data);
    };
    
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <input {...register('email')} placeholder="Email" />
            {errors.email && <span>{errors.email.message}</span>}
            
            <input {...register('password')} type="password" placeholder="Password" />
            {errors.password && <span>{errors.password.message}</span>}
            
            <button type="submit">Submit</button>
        </form>
    );
};
`;

/**
 * Integration with FormValidationPopover
 */

// Example: How to use the FormValidationPopover in your components
export const popoverIntegrationExample = `
import { FormValidationPopover } from './form-validation-popover';

const MyFormField = ({ field, index, onChange }) => {
    return (
        <div className="flex items-center gap-2">
            <input 
                value={field.value} 
                onChange={(e) => onChange('value', index, e.target.value)}
                placeholder={field.name}
            />
            <FormValidationPopover
                index={index}
                field={field}
                fieldType={field.type}
                changeValue={onChange}
            />
        </div>
    );
};
`;

/**
 * Available Validation Types
 */

export const validationTypes = {
    // String validations
    string: [
        'required',
        'optional',
        'minLength',
        'maxLength',
        'email',
        'url',
        'uuid',
        'regex',
        'startsWith',
        'endsWith',
        'includes',
    ],
    
    // Number validations
    number: [
        'required',
        'optional',
        'min',
        'max',
        'positive',
        'negative',
        'int',
        'finite',
    ],
    
    // Date validations
    date: [
        'required',
        'optional',
        'minDate',
        'maxDate',
    ],
    
    // Boolean validations
    boolean: [
        'required',
        'optional',
    ],
};

/**
 * Best Practices
 */

export const bestPractices = {
    // 1. Always provide meaningful custom messages
    customMessages: 'Use descriptive error messages that help users understand what went wrong.',
    
    // 2. Use appropriate validation types
    validationTypes: 'Choose validation types that match your field type (string, number, date, boolean).',
    
    // 3. Consider user experience
    userExperience: 'Don\'t over-validate. Focus on essential validations that prevent data corruption.',
    
    // 4. Test your schemas
    testing: 'Always test your generated schemas with various input scenarios.',
    
    // 5. Keep configurations maintainable
    maintainability: 'Organize your validation configurations in a structured way for easy maintenance.',
};

export default {
    basicFormExample,
    advancedFormExample,
    userRegistrationExample,
    generateSchemaExample,
    generateCompleteCodeExample,
    reactFormValidationExample,
    popoverIntegrationExample,
    validationTypes,
    bestPractices,
}; 