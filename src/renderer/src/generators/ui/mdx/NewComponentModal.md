# NewComponentModal Component

## Overview

The `NewComponentModal` is a comprehensive React component that provides a user-friendly interface for creating new components within the IGRP Studio. This modal offers advanced functionality for component creation, including argument configuration, icon selection, and page association.

## 🎯 **Purpose**

The NewComponentModal serves as the primary interface for:
- Creating reusable React components
- Configuring component arguments and parameters
- Associating components with specific pages
- Setting up component metadata and properties
- Generating component signatures automatically

## 🚀 **Key Features**

### Core Functionality
- **Component Creation**: Create new components with full configuration
- **Argument Management**: Define and configure component arguments
- **Icon Selection**: Choose from a library of icons for components
- **Page Association**: Link components to specific pages or keep them global
- **Real-time Preview**: See generated component signatures as you type
- **Validation**: Comprehensive form validation with error handling

### Advanced Features
- **Function Arguments**: Support for complex function parameters
- **Type System**: Full TypeScript type support
- **Scope Management**: App-level or page-specific components
- **Auto-generation**: Smart name and path generation
- **Git Integration**: Automatic commit creation after component creation

## 📋 **Component Interface**

### Props Interface
```typescript
interface NewComponentModalProps {
    isOpen: boolean;
    basePath: string;
    pageOptions: any[];
    currentComponent?: PageDefinition;
    onClose: () => void;
    onConfirm: () => void;
}
```

### Form Fields
1. **Component Title** (Description)
   - Required field
   - Auto-generates component name on blur
   - Placeholder: "Todo Item"

2. **Component Name**
   - Required field
   - Must follow naming conventions (no spaces/hyphens)
   - Auto-generated from title

3. **Page Association**
   - Optional dropdown
   - Links component to specific pages
   - Changes scope from 'app' to 'page'

4. **Icon Browser**
   - Visual icon selection
   - Searchable icon library
   - Preview selected icon

5. **Function Arguments**
   - Complex argument configuration
   - Support for optional parameters
   - Type validation
   - List/array support

## 🔧 **Technical Implementation**

### Form Management
- **Formik Integration**: Handles form state and validation
- **Yup Validation**: Comprehensive validation schema
- **Auto-generation**: Smart field population
- **Error Handling**: User-friendly error messages

### State Management
```typescript
const [arguments_, setArguments] = useState<Arguments[]>([]);
```

### Validation Schema
```typescript
const validationSchema = Yup.object({
    description: Yup.string().required(
        t('thisFieldRequired', { name: t('componentTitle') })
    ),
    name: Yup.string()
        .required(t('thisFieldRequired', { name: t('name') }))
        .matches(PATTERNS.NO_SPACE_AND_HYPHEN, t('msgInfoAccpet')),
});
```

## 🎨 **User Interface**

### Modal Layout
- **Two-Column Layout**: Form fields on left, arguments on right
- **Responsive Design**: Adapts to different screen sizes
- **Visual Separator**: Clear distinction between sections

### Form Sections
1. **Basic Information**
   - Component title and name
   - Page association dropdown

2. **Visual Configuration**
   - Icon browser with search
   - Icon preview

3. **Advanced Configuration**
   - Function arguments panel
   - Type selection
   - Parameter configuration

4. **Preview Section**
   - Generated component signature
   - Real-time code preview

## 🔧 **FunctionArguments Component**

### Overview
The `FunctionArguments` component is a powerful tool within the NewComponentModal that allows users to define and configure function parameters for their components. This component provides an intuitive interface for creating complex component signatures with proper TypeScript typing.

### Purpose
- **Parameter Definition**: Define function parameters with proper types
- **Type Safety**: Ensure TypeScript compatibility
- **Optional Parameters**: Mark parameters as optional
- **Complex Types**: Support for objects, arrays, and functions
- **Real-time Preview**: See how arguments affect component signature

### Key Features

#### 1. **Argument Management**
- **Add Arguments**: Click "+" to add new function parameters
- **Remove Arguments**: Delete unwanted parameters
- **Reorder Arguments**: Drag and drop to reorder parameters
- **Duplicate Arguments**: Copy existing arguments for similar parameters

#### 2. **Type System**
- **Basic Types**: string, number, boolean, Date, etc.
- **Complex Types**: object, array, function, custom types
- **Optional Types**: Mark parameters as optional with '?'
- **Array Types**: Support for typed arrays (e.g., string[], number[])
- **Function Types**: Define callback functions with parameters

#### 3. **Parameter Configuration**
- **Name**: Parameter name (must be valid JavaScript identifier)
- **Type**: Data type for the parameter
- **Required/Optional**: Toggle parameter requirement
- **Default Value**: Set default values for optional parameters
- **Description**: Add documentation for the parameter

#### 4. **Advanced Features**
- **Function Parameters**: Define parameters for callback functions
- **Return Types**: Specify return types for function parameters
- **Generic Types**: Support for generic type parameters
- **Union Types**: Combine multiple types (e.g., string | number)
- **Custom Types**: Reference custom TypeScript interfaces

### User Interface Elements

#### Argument List
- **Visual List**: Each argument displayed as a card
- **Expandable Cards**: Click to expand/collapse argument details
- **Quick Actions**: Edit, delete, duplicate buttons on each card
- **Drag Handle**: Reorder arguments by dragging

#### Argument Form
- **Name Field**: Parameter name input
- **Type Selector**: Dropdown with available types
- **Required Toggle**: Checkbox for optional/required
- **Default Value**: Input for default values
- **Description**: Text area for parameter documentation

#### Type Configuration
- **Basic Type Selector**: Choose from primitive types
- **Complex Type Builder**: Build complex types step by step
- **Function Type Builder**: Define function signatures
- **Array Type Builder**: Configure array types
- **Custom Type Reference**: Link to existing TypeScript interfaces

### Usage Examples

#### Basic String Parameter
```typescript
// Configuration
{
    name: "title",
    type: "string",
    required: true,
    description: "The title of the component"
}

// Generated Signature
function myComponent(title: string) {
    // Component implementation
}
```

#### Optional Number Parameter
```typescript
// Configuration
{
    name: "count",
    type: "number",
    required: false,
    defaultValue: 0,
    description: "Number of items to display"
}

// Generated Signature
function myComponent(title: string, count?: number = 0) {
    // Component implementation
}
```

#### Array Parameter
```typescript
// Configuration
{
    name: "items",
    type: "array",
    arrayType: "string",
    required: true,
    description: "List of items to display"
}

// Generated Signature
function myComponent(title: string, count?: number = 0, items: string[]) {
    // Component implementation
}
```

#### Function Parameter
```typescript
// Configuration
{
    name: "onClick",
    type: "function",
    functionParameters: [
        { name: "event", type: "MouseEvent", required: true },
        { name: "data", type: "any", required: false }
    ],
    returnType: "void",
    description: "Callback function for click events"
}

// Generated Signature
function myComponent(
    title: string, 
    count?: number = 0, 
    items: string[], 
    onClick: (event: MouseEvent, data?: any) => void
) {
    // Component implementation
}
```

### Workflow

#### Step 1: Add Arguments
1. Click the "+" button in the FunctionArguments panel
2. A new argument card appears
3. Fill in the basic information (name, type)

#### Step 2: Configure Types
1. Select the appropriate type from the dropdown
2. For complex types, use the type builder
3. Configure additional type options (array, optional, etc.)

#### Step 3: Set Properties
1. Mark as required or optional
2. Add default values if optional
3. Provide description for documentation

#### Step 4: Review Preview
1. Check the generated signature in the preview panel
2. Verify the TypeScript compatibility
3. Make adjustments as needed

### Best Practices

#### Naming Conventions
- **Descriptive Names**: Use clear, meaningful parameter names
- **Camel Case**: Follow JavaScript naming conventions
- **Avoid Abbreviations**: Use full words for clarity
- **Consistent Naming**: Maintain consistency across similar parameters

#### Type Selection
- **Choose Appropriate Types**: Select the most specific type possible
- **Use Optional Types**: Mark parameters as optional when appropriate
- **Consider Default Values**: Provide sensible defaults for optional parameters
- **Document Complex Types**: Add descriptions for complex parameters

#### Organization
- **Logical Order**: Arrange parameters in logical order
- **Required First**: Put required parameters before optional ones
- **Related Parameters**: Group related parameters together
- **Consistent Patterns**: Follow consistent patterns across components

### Common Use Cases

#### Form Components
```typescript
// Common form component parameters
{
    name: "value",
    type: "string",
    required: true
},
{
    name: "onChange",
    type: "function",
    functionParameters: [{ name: "value", type: "string" }],
    returnType: "void"
},
{
    name: "placeholder",
    type: "string",
    required: false
}
```

#### List Components
```typescript
// Common list component parameters
{
    name: "items",
    type: "array",
    arrayType: "object",
    required: true
},
{
    name: "renderItem",
    type: "function",
    functionParameters: [{ name: "item", type: "object" }],
    returnType: "ReactNode"
},
{
    name: "loading",
    type: "boolean",
    required: false,
    defaultValue: false
}
```

#### Modal Components
```typescript
// Common modal component parameters
{
    name: "isOpen",
    type: "boolean",
    required: true
},
{
    name: "onClose",
    type: "function",
    functionParameters: [],
    returnType: "void"
},
{
    name: "title",
    type: "string",
    required: false
}
```

### Troubleshooting

#### Common Issues

**Q: Why can't I add a new argument?**
A: Check that the previous argument is properly configured. All required fields must be filled.

**Q: Why is the type dropdown empty?**
A: Ensure you're using the latest version of the component. Type definitions are loaded dynamically.

**Q: How do I create a complex function type?**
A: Use the function type builder to define parameters and return types step by step.

**Q: Why isn't my argument showing in the preview?**
A: Check that the argument name is valid (no spaces, special characters) and all required fields are filled.

**Q: How do I make a parameter optional?**
A: Uncheck the "Required" checkbox and optionally provide a default value.

### Integration with Component Creation

The FunctionArguments component integrates seamlessly with the NewComponentModal:

1. **Real-time Updates**: Changes in FunctionArguments immediately update the component signature preview
2. **Validation**: Argument validation is included in the overall form validation
3. **Persistence**: Argument configurations are saved with the component
4. **Export**: Arguments are included in the generated component code

### Advanced Features

#### Custom Type Support
- **Interface References**: Link to existing TypeScript interfaces
- **Generic Types**: Support for generic type parameters
- **Union Types**: Combine multiple types with union operators
- **Intersection Types**: Merge multiple types with intersection operators

#### Validation Rules
- **Name Validation**: Ensure valid JavaScript identifiers
- **Type Validation**: Verify TypeScript compatibility
- **Required Field Validation**: Ensure all required fields are filled
- **Duplicate Name Prevention**: Prevent duplicate parameter names

#### Performance Optimization
- **Lazy Loading**: Type definitions loaded on demand
- **Debounced Updates**: Preview updates are debounced for performance
- **Virtual Scrolling**: Large argument lists use virtual scrolling
- **Memoization**: Expensive calculations are memoized

---

## 📝 **Usage Examples**

### Basic Component Creation
```typescript
<NewComponentModal
    isOpen={showFormComponent}
    basePath={basePath}
    pageOptions={pageOptions}
    onClose={() => setFormComponent(false)}
    onConfirm={handleNewComponent}
/>
```

### With Current Component (Editing)
```typescript
<NewComponentModal
    isOpen={showFormComponent}
    basePath={basePath}
    pageOptions={pageOptions}
    currentComponent={existingComponent}
    onClose={() => setFormComponent(false)}
    onConfirm={handleNewComponent}
/>
```

## 🔄 **Workflow**

### Step 1: Open Modal
- User clicks "Create New Component" button
- Modal opens with empty form

### Step 2: Fill Basic Information
- Enter component title
- Component name auto-generates
- Select page association (optional)

### Step 3: Configure Visual Elements
- Choose icon from browser
- Preview selected icon

### Step 4: Set Up Arguments
- Add function arguments
- Configure parameter types
- Set optional/required status

### Step 5: Review and Create
- Review generated signature
- Validate form
- Create component

## ⚙️ **Configuration Options**

### Component Scope
- **App Scope**: Available globally across the application
- **Page Scope**: Only available on specific pages

### Argument Types
- **Basic Types**: string, number, boolean, etc.
- **Complex Types**: objects, arrays, functions
- **Optional Parameters**: Marked with '?' suffix
- **List Support**: Array types with '[]' suffix

### Icon System
- **Searchable Library**: Find icons by name
- **Visual Preview**: See icon before selection
- **Category Organization**: Icons organized by type

## 🎯 **Generated Output**

### Component Signature
```typescript
export default function myComponent(
    param1: string,
    param2?: number,
    callback: (data: any) => void
) {
    // Component implementation
}
```

### File Structure
```
components/
├── MyComponent/
│   ├── index.tsx
│   ├── types.ts
│   └── styles.css
```

## ⚠️ **Validation Rules**

### Naming Conventions
- **Component Name**: `[a-zA-Z0-9]+` (no spaces/hyphens)
- **Description**: Required, descriptive text
- **Arguments**: Valid TypeScript types

### Required Fields
- Component title (description)
- Component name
- Valid argument types

### Error Handling
- **Field Validation**: Real-time validation feedback
- **Type Checking**: TypeScript type validation
- **Duplicate Prevention**: Check for existing names

## 🔗 **Integration Points**

### Engine Integration
```typescript
const { error } = await window.engine.createPage(
    { ...pageConfig, id: getId() },
    ENV_TYPES.NEXTJS,
    basePath
);
```

### Git Integration
```typescript
createGitCommit(
    basePath,
    t('addComponent', { name: pageConfig.name })
);
```

### Toast Notifications
- **Success**: Component created successfully
- **Error**: Validation or creation errors

## 📈 **Best Practices**

### Component Design
1. **Descriptive Names**: Use clear, meaningful names
2. **Proper Scoping**: Choose appropriate scope (app vs page)
3. **Icon Selection**: Pick relevant icons for better UX
4. **Argument Planning**: Plan arguments before creation

### Development Workflow
1. **Plan Component**: Define purpose and requirements
2. **Configure Arguments**: Set up necessary parameters
3. **Choose Icon**: Select appropriate visual representation
4. **Test Creation**: Verify component works as expected

## 🆘 **Troubleshooting**

### Common Issues

**Q: Why can't I save the component?**
A: Check that all required fields are filled and naming conventions are followed.

**Q: Why is the argument panel not working?**
A: Ensure you're using supported argument types and valid configurations.

**Q: How do I associate a component with a page?**
A: Use the page association dropdown to select a specific page.

**Q: Can I edit an existing component?**
A: Yes, pass the existing component as `currentComponent` prop.

## 🔮 **Future Enhancements**

### Planned Features
- **Template Library**: Pre-built component templates
- **Advanced Type System**: More complex type definitions
- **Component Preview**: Live preview of component
- **Bulk Creation**: Create multiple components at once
- **Import/Export**: Component configuration sharing

### Technical Improvements
- **Performance Optimization**: Faster form rendering
- **Enhanced Validation**: More sophisticated validation rules
- **Better Error Handling**: More detailed error messages
- **Accessibility**: Improved keyboard navigation

---

**Component**: NewComponentModal  
**Version**: 1.0  
**Last Updated**: December 2024  
**Author**: IGRP Studio Team 