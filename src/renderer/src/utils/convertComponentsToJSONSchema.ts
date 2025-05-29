type Prop = {
    name: string;
    type: string;
    isOptional: boolean;
};

type Component = {
    name: string;
    props: Prop[];
};

export function convertComponentsToJSONSchema(props: Prop[]) {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    props.forEach((prop) => {
        properties[prop.name] = { type: mapToJSONSchemaType(prop.type) };
        if (!prop.isOptional) {
            required.push(prop.name);
        }
    });
    
    return properties;
}

// Optional helper to normalize types
function mapToJSONSchemaType(type: string): string {
    switch (type.toLowerCase()) {
        case "string":
        case "text":
            return "string";
        case "number":
        case "int":
        case "float":
            return "number";
        case "boolean":
            return "boolean";
        case "array":
            return "array";
        case "object":
            return "object";
        case "any":
        default:
            return "any"; // JSON Schema doesn’t officially support "any", consider omitting or using "object"
    }
}
