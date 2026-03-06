import {
  Arguments,
  CustomFunctionConfig,
  Import,
  State
} from '@igrp/igrp-studio-nextjs-engine/types'
import { EmptyList } from '@renderer/components/empty-list'
import { IGRPBadgePrimitive, IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system'
import {
  IGRPTooltipPrimitive,
  IGRPTooltipContentPrimitive,
  IGRPTooltipProviderPrimitive,
  IGRPTooltipTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { IGRPBadge } from '@igrp/igrp-framework-react-design-system'
import { getId } from '@renderer/utils'
import { FunctionSquare, Type, Info, Code, Zap } from 'lucide-react'
import { JSX, useMemo } from 'react'

interface TabStatesProps {
  states: State[]
  editorRef?: React.RefObject<any>
  onSelectState?: (state: State) => void
  globalFilter?: string
  pageArguments?: Arguments[]
}

interface TabFunctionsProps {
  functions: ComponentCustomFunctionConfig[]
  currentFunction?: ComponentCustomFunctionConfig
  editorRef?: React.RefObject<any>
  onInsertImport?: (importObj: Import) => void
  globalFilter?: string
}

interface TabSnippetsProps {
  snippets: any[]
  componentTag: string
  editorRef?: React.RefObject<any>
  globalFilter?: string
}

interface TabTypesProps {
  types: any[]
  editorRef?: React.RefObject<any>
  globalFilter?: string
  onInsertImport?: (importObj: Import) => void
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export interface ComponentCustomFunctionConfig extends CustomFunctionConfig {
  args?: Arguments[] // Alternative property for arguments in components
}

const TabStates = ({
  states,
  editorRef,
  onSelectState,
  globalFilter,
  pageArguments
}: TabStatesProps) => {
  const allStates = useMemo(() => {
    const pageArgsAsStates: State[] = (pageArguments || []).map((arg) => ({
      ...arg,
      defaultValue: '',
      imports: []
    }))
    return [...states, ...pageArgsAsStates]
  }, [states, pageArguments])

  const filteredStates = useMemo(() => {
    if (!globalFilter) return allStates
    return allStates.filter(
      (state) =>
        (state.name?.toLowerCase() || '').includes(globalFilter.toLowerCase()) ||
        (state.type?.toLowerCase() || '').includes(globalFilter.toLowerCase())
    )
  }, [allStates, globalFilter])

  const handleInsertState = (state: State) => {
    if (editorRef && editorRef.current) {
      editorRef.current.insertTextAtCursor(state.name)
    }

    onSelectState?.(state)
  }

  const handleInsertStateSet = (state: State) => {
    if (editorRef && editorRef.current) {
      const textToInsert = `set${capitalizeFirstLetter(state.name)}(${state.defaultValue || ''})\n`
      editorRef.current.insertTextAtCursor(textToInsert)
    }

    onSelectState?.(state)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="w-4 h-4" />
        <span>
          Use <strong>Name</strong> to insert the state variable, or <strong>Set</strong> to insert
          the setter function
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {filteredStates.length > 0 ? (
          filteredStates.map((state, index) => (
            <div
              key={index}
              className="flex flex-col w-full border p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <div className="flex justify-between items-start w-full">
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{state.name}</span>
                    {pageArguments?.some((arg) => arg.id === state.id) && (
                      <IGRPBadge variant="soft" className="text-xs">
                        Page Arg
                      </IGRPBadge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <IGRPBadge variant="outline">
                      {state.type}
                      {state.defaultValue && ` - Default: ${state.defaultValue}`}
                    </IGRPBadge>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-3">
                  <IGRPTooltipProviderPrimitive>
                    <IGRPTooltipPrimitive>
                      <IGRPTooltipTriggerPrimitive asChild>
                        <IGRPButtonPrimitive
                          size={'sm'}
                          variant="outline"
                          onClick={() => handleInsertState(state)}
                          className="flex items-center gap-1"
                        >
                          <Code className="w-3 h-3" />
                          Name
                        </IGRPButtonPrimitive>
                      </IGRPTooltipTriggerPrimitive>
                      <IGRPTooltipContentPrimitive>
                        <p>Insert state variable name</p>
                      </IGRPTooltipContentPrimitive>
                    </IGRPTooltipPrimitive>
                  </IGRPTooltipProviderPrimitive>

                  {!pageArguments?.some((arg) => arg.id === state.id) && (
                    <IGRPTooltipProviderPrimitive>
                      <IGRPTooltipPrimitive>
                        <IGRPTooltipTriggerPrimitive asChild>
                          <IGRPButtonPrimitive
                            size={'sm'}
                            variant="outline"
                            onClick={() => handleInsertStateSet(state)}
                            className="flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3" />
                            Set
                          </IGRPButtonPrimitive>
                        </IGRPTooltipTriggerPrimitive>
                        <IGRPTooltipContentPrimitive>
                          <p>Insert setter function with default value</p>
                        </IGRPTooltipContentPrimitive>
                      </IGRPTooltipPrimitive>
                    </IGRPTooltipProviderPrimitive>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyList
            icon={<FunctionSquare />}
            title={globalFilter ? 'No matching states' : 'No States'}
            description={
              globalFilter
                ? 'Try adjusting your search terms'
                : 'Create your first custom state to add functionality to your page!'
            }
            className="py-12"
          />
        )}
      </div>
    </div>
  )
}

const TabSnipptes = ({ snippets, componentTag, editorRef, globalFilter }: TabSnippetsProps) => {
  const filteredSnippets = useMemo(() => {
    if (!globalFilter) return snippets
    return snippets.filter(
      (snippet) =>
        (snippet.title?.toLowerCase() || '').includes(globalFilter.toLowerCase()) ||
        (snippet.type?.toLowerCase() || '').includes(globalFilter.toLowerCase()) ||
        (snippet.description?.toLowerCase() || '').includes(globalFilter.toLowerCase())
    )
  }, [snippets, globalFilter])

  const handleInsertSnippet = (snippet: any): void => {
    if (editorRef && editorRef.current) {
      editorRef.current.insertTextAtCursor(snippet.code.replace('{{tag}}', componentTag))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="w-4 h-4" />
        <span>Click &quot;Insert Code&quot; to add the code snippet to your editor</span>
      </div>

      <div className="flex flex-col gap-3">
        {filteredSnippets.length > 0 ? (
          filteredSnippets.map((snippet, index) => (
            <div
              key={index}
              className="flex flex-col w-full border p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <div className="flex justify-between items-start w-full">
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate ">{snippet.title}</span>
                    {snippet.type && (
                      <IGRPBadgePrimitive variant="outline" className="text-xs">
                        {snippet.type}
                      </IGRPBadgePrimitive>
                    )}
                  </div>

                  {snippet.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {snippet.description}
                    </p>
                  )}

                  {snippet.code && (
                    <div className="mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Code className="w-3 h-3" />
                        <span>Preview:</span>
                      </div>
                      <div className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
                        {snippet.code.replace('{{tag}}', componentTag).substring(0, 100)}
                        {snippet.code.length > 100 && '...'}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-3">
                  <IGRPTooltipProviderPrimitive>
                    <IGRPTooltipPrimitive>
                      <IGRPTooltipTriggerPrimitive asChild>
                        <IGRPButtonPrimitive
                          variant="outline"
                          size={'sm'}
                          onClick={() => handleInsertSnippet(snippet)}
                          className="flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" />
                          Insert
                        </IGRPButtonPrimitive>
                      </IGRPTooltipTriggerPrimitive>
                      <IGRPTooltipContentPrimitive>
                        <p>Insert code snippet into editor</p>
                      </IGRPTooltipContentPrimitive>
                    </IGRPTooltipPrimitive>
                  </IGRPTooltipProviderPrimitive>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyList
            icon={<FunctionSquare />}
            title={globalFilter ? 'No matching snippets' : 'No Snippets'}
            description={
              globalFilter
                ? 'Try adjusting your search terms'
                : 'Create your first custom snippet to add functionality to your page!'
            }
            className="py-12"
          />
        )}
      </div>
    </div>
  )
}

const TabsFunctions = ({
  functions,
  currentFunction,
  editorRef,
  onInsertImport,
  globalFilter
}: TabFunctionsProps) => {
  const filteredFunctions = useMemo(() => {
    let filtered = currentFunction
      ? functions.filter((funct) => funct.id !== currentFunction.id)
      : functions

    if (globalFilter) {
      filtered = filtered.filter(
        (funct) =>
          (funct.name?.toLowerCase() || '').includes(globalFilter.toLowerCase()) ||
          (funct.returnValue?.type?.toLowerCase() || '').includes(globalFilter.toLowerCase())
      )
    }

    return filtered
  }, [functions, currentFunction, globalFilter])

  const handleInsertFunction = (funct: ComponentCustomFunctionConfig): void => {
    if (editorRef && editorRef.current) {
      let code = funct.code
      if ((funct.id || !code) && funct.name) {
        // Build function call with arguments
        const args = funct.arguments || funct.args || []
        if (args.length > 0) {
          // Create argument placeholders with types for better UX
          const argPlaceholders = args
            .map((arg) => {
              if (arg.isOptional) {
                return `${arg.name}?: ${arg.type}`
              } else if (arg.isList) {
                return `${arg.name}: ${arg.type}[]`
              } else {
                return `${arg.name}: ${arg.type}`
              }
            })
            .join(', ')
          code = `${funct.name}(${argPlaceholders});`
        } else {
          code = `${funct.name}();`
        }
      }
      editorRef.current.insertTextAtCursor(code)
      if (funct.path)
        onInsertImport?.({
          namespace: `import {${funct.name}} from '${funct.path}'`,
          id: getId()
        })
    }
  }

  const renderParameters = (params: any[]): JSX.Element | null => {
    if (!params || params.length === 0) return null

    return (
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Code className="w-3 h-3" />
          <span>Parameters:</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {params.map((param, idx) => (
            <IGRPTooltipProviderPrimitive key={idx}>
              <IGRPTooltipPrimitive>
                <IGRPTooltipTriggerPrimitive asChild>
                  <IGRPBadge variant="soft" className="text-xs cursor-help">
                    {param.name}
                    {param.isOptional && '?'}
                    {param.isList && '[]'}
                    <span className="text-muted-foreground ml-1">: {param.type}</span>
                  </IGRPBadge>
                </IGRPTooltipTriggerPrimitive>
                <IGRPTooltipContentPrimitive>
                  <div className="text-xs">
                    <div className="font-medium">{param.name}</div>
                    <div className="text-muted-foreground">Type: {param.type}</div>
                    {param.isOptional && <div className="text-blue-500">Optional</div>}
                    {param.isList && <div className="text-green-500">Array</div>}
                  </div>
                </IGRPTooltipContentPrimitive>
              </IGRPTooltipPrimitive>
            </IGRPTooltipProviderPrimitive>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="w-4 h-4" />
        <span>Click &quot;Insert Code&quot; to add the function call to your editor</span>
      </div>

      <div className="flex flex-col gap-3">
        {filteredFunctions.length > 0 ? (
          filteredFunctions.map((funct, index) => (
            <div
              key={index}
              className="flex flex-col w-full border p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <div className="flex justify-between items-start w-full">
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{funct.name}</span>
                    {funct.returnValue?.type && (
                      <IGRPBadge variant="outline" className="text-xs">
                        → {funct.returnValue.type}
                      </IGRPBadge>
                    )}
                  </div>

                  {/* Display function parameters */}
                  {(funct.arguments || funct.args) &&
                    renderParameters(funct.arguments || funct.args)}
                </div>

                <div className="flex items-center gap-2 ml-3">
                  <IGRPTooltipProviderPrimitive>
                    <IGRPTooltipPrimitive>
                      <IGRPTooltipTriggerPrimitive asChild>
                        <IGRPButtonPrimitive
                          size={'sm'}
                          variant="outline"
                          onClick={() => {
                            handleInsertFunction(funct)
                          }}
                          className="flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" />
                          Insert
                        </IGRPButtonPrimitive>
                      </IGRPTooltipTriggerPrimitive>
                      <IGRPTooltipContentPrimitive>
                        <p>Insert function call into editor</p>
                      </IGRPTooltipContentPrimitive>
                    </IGRPTooltipPrimitive>
                  </IGRPTooltipProviderPrimitive>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyList
            icon={<FunctionSquare />}
            title={globalFilter ? 'No matching functions' : 'No Functions'}
            description={
              globalFilter
                ? 'Try adjusting your search terms'
                : 'Create your first custom functions to add functionality to your page!'
            }
            className="py-12"
          />
        )}
      </div>
    </div>
  )
}

const TabTypes = ({ types, editorRef, globalFilter, onInsertImport }: TabTypesProps) => {
  const filteredTypes = useMemo(() => {
    if (!globalFilter) return types
    return types.filter(
      (type) =>
        (type.name?.toLowerCase() || '').includes(globalFilter.toLowerCase()) ||
        (type.type?.toLowerCase() || '').includes(globalFilter.toLowerCase())
    )
  }, [types, globalFilter])

  const handleInsertType = (type: any): void => {
    if (editorRef && editorRef.current) {
      editorRef.current.insertTextAtCursor(type.name)

      if (type.path)
        onInsertImport?.({
          namespace: `import {${type.name}} from '${type.path}'`,
          id: getId()
        })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="w-4 h-4" />
        <span>Click &quot;Insert Type&quot; to add the type name and import statement to your editor</span>
      </div>

      <div className="flex flex-col gap-3">
        {filteredTypes.length > 0 ? (
          filteredTypes.map((type, index) => (
            <div
              key={index}
              className="flex flex-col w-full border p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <div className="flex justify-between items-start w-full">
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{type.name}</span>
                    <IGRPBadge variant="outline" className="text-xs">
                      {type.type}
                    </IGRPBadge>
                    {type.path && (
                      <IGRPBadge variant="soft" className="text-xs">
                        Import
                      </IGRPBadge>
                    )}
                  </div>

                  {type.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{type.description}</p>
                  )}

                  {type.path && (
                    <div className="mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Code className="w-3 h-3" />
                        <span>From:</span>
                      </div>
                      <div className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
                        {type.path}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-3">
                  <IGRPTooltipProviderPrimitive>
                    <IGRPTooltipPrimitive>
                      <IGRPTooltipTriggerPrimitive asChild>
                        <IGRPButtonPrimitive
                          variant="outline"
                          size={'sm'}
                          onClick={() => handleInsertType(type)}
                          className="flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" />
                          Insert
                        </IGRPButtonPrimitive>
                      </IGRPTooltipTriggerPrimitive>
                      <IGRPTooltipContentPrimitive>
                        <p>Insert type name and import statement</p>
                      </IGRPTooltipContentPrimitive>
                    </IGRPTooltipPrimitive>
                  </IGRPTooltipProviderPrimitive>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyList
            icon={<Type />}
            title={globalFilter ? 'No matching types' : 'No Types'}
            description={
              globalFilter
                ? 'Try adjusting your search terms'
                : 'Create your first custom type to add functionality to your page!'
            }
            className="py-12"
          />
        )}
      </div>
    </div>
  )
}

export { TabStates, TabSnipptes, TabsFunctions, TabTypes }
