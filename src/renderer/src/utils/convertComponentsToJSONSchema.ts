type Prop = {
  name: string
  type: string
  isOptional: boolean
  isFunction: boolean
}

export function convertComponentsToJSONSchema(props: Prop[]) {
  const properties: Record<string, any> = {}
  const required: string[] = []

  props &&
    props
      .filter((prop) => prop.name !== '' && !prop.isFunction)
      .forEach((prop) => {
        properties[prop.name] = {
          type: mapToJSONSchemaType(prop.type)
        }
        if (!prop.isOptional) {
          required.push(prop.name)
        }
      })

  return properties
}

export function convertCompToInteractinsJSONSchema(props: Prop[]) {
  const properties: Record<string, any> = {}
  props &&
    props
      .filter((prop) => prop.name !== '' && prop.isFunction)
      .forEach((prop) => {
        properties[prop.name] = {
          type: 'function',
          properties: {
            function: {
              type: 'object',
              properties: {
                fnName: {
                  type: 'string',
                  required: false,
                  visible: true
                },
                fnCustomCode: {
                  type: 'string',
                  required: false,
                  visible: false,
                  properties: {
                    imports: {
                      type: 'array',
                      required: false,
                      visible: true,
                      items: {
                        type: 'object',
                        properties: {
                          namespace: {
                            type: 'string',
                            required: true
                          }
                        }
                      }
                    }
                  }
                },
                actionName: {
                  type: 'string',
                  required: false,
                  visible: false
                },
                fnCustomSet: {
                  type: 'string',
                  required: false,
                  default: '() => {}',
                  visible: true
                },
                type: {
                  type: 'string',
                  default: 'function'
                }
              }
            }
          }
        }
      })

  return properties
}

// Optional helper to normalize types
function mapToJSONSchemaType(type: string): string {
  switch (type.toLowerCase()) {
    case 'string':
    case 'text':
      return 'string'
    case 'number':
    case 'int':
    case 'float':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'array':
      return 'array'
    case 'object':
      return 'object'
    case 'any':
    default:
      return 'any' // JSON Schema doesn’t officially support "any", consider omitting or using "object"
  }
}
