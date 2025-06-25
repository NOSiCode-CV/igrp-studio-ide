import {
    CustomFunctionConfig,
    Import,
    State,
} from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { EmptyList } from '@renderer/components/empty-list';
import { Button } from '@renderer/components/ui/button';
import { getId } from '@renderer/utils';
import { FunctionSquare } from 'lucide-react';
import { useMemo } from 'react';

interface TabStatesProps {
    states: State[];
    editorRef?: React.RefObject<any>;
    onSelectState?: (state: State) => void;
    globalFilter?: string;
}

interface TabFunctionsProps {
    functions: CustomFunctionConfig[];
    currentFunction?: CustomFunctionConfig;
    editorRef?: React.RefObject<any>;
    onInsertImport?: (importObj: Import) => void;
    globalFilter?: string;
}

interface TabSnippetsProps {
    snippets: any[];
    componentTag: string;
    editorRef?: React.RefObject<any>;
    globalFilter?: string;
}

function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const TabStates = ({ states, editorRef, onSelectState, globalFilter }: TabStatesProps) => {
    const filteredStates = useMemo(() => {
        if (!globalFilter) return states;
        return states.filter(state => 
            (state.name?.toLowerCase() || '').includes(globalFilter.toLowerCase()) ||
            (state.type?.toLowerCase() || '').includes(globalFilter.toLowerCase())
        );
    }, [states, globalFilter]);

    const handleInsertState = (state: State) => {
        if (editorRef && editorRef.current) {
            editorRef.current.insertTextAtCursor(state.name);
        }

        onSelectState?.(state);
    };

    const handleInsertStateSet = (state: State) => {
        if (editorRef && editorRef.current) {
            const textToInsert = `set${capitalizeFirstLetter(state.name)}(${state.defaultValue || ''})\n`;
            editorRef.current.insertTextAtCursor(textToInsert);
        }

        onSelectState?.(state);
    };

    return (
        <div className="space-y-4">
            <p className="text-muted-foreground text-xs">
                Use <strong>Name</strong> to insert the state name, or <strong>Set</strong> to insert the setter function with its default value.
            </p>

            <div className="flex flex-col gap-2">
                {filteredStates.length > 0 ? (
                    filteredStates.map((state, index) => (
                        <div
                            key={index}
                            className="flex justify-between items-center w-full border p-2 rounded-sm hover:bg-accent hover:text-accent-foreground"
                        >
                            <div className="flex flex-col space-x-2">
                                <span className="font-medium truncate max-w-[150px]">{state.name}</span>
                                <span className="text-muted-foreground text-sm">
                                    {state.type}
                                </span>
                            </div>
                            <div className='space-x-2 flex flex-1 justify-end'>
                                <Button
                                    size={'sm'}
                                    variant="outline"
                                    onClick={() => {
                                        handleInsertState(state);
                                    }}
                                >
                                    Name
                                </Button>
                                <Button
                                    size={'sm'}
                                    variant="outline"
                                    onClick={() => {
                                        handleInsertStateSet(state);
                                    }}
                                >
                                    Set
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <EmptyList
                        icon={<FunctionSquare />}
                        title={globalFilter ? "No matching states" : "No States"}
                        description={globalFilter ? "Try adjusting your search terms" : "Create your first custom state to add functionality to your page!"}
                        className="py-12"
                    />
                )}
            </div>
        </div>
    );
};

const TabSnipptes = ({
    snippets,
    componentTag,
    editorRef,
    globalFilter,
}: TabSnippetsProps) => {
    const filteredSnippets = useMemo(() => {
        if (!globalFilter) return snippets;
        return snippets.filter(snippet => 
            (snippet.title?.toLowerCase() || '').includes(globalFilter.toLowerCase()) ||
            (snippet.type?.toLowerCase() || '').includes(globalFilter.toLowerCase()) ||
            (snippet.description?.toLowerCase() || '').includes(globalFilter.toLowerCase())
        );
    }, [snippets, globalFilter]);

    const handleInsertSnippet = (snippet: any) => {
        if (editorRef && editorRef.current) {
            editorRef.current.insertTextAtCursor(
                snippet.code.replace('{{tag}}', componentTag)
            );
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2">
                {filteredSnippets.length > 0 ? (
                    filteredSnippets.map((snippet, index) => (
                        <div
                            key={index}
                            className="flex justify-between items-center w-full border p-2 rounded hover:bg-accent hover:text-accent-foreground"
                        >
                            <div className="flex flex-col">
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">
                                        {snippet.title}
                                    </span>
                                    <span className="text-gray-400 text-sm">
                                        {snippet.type}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {snippet.description}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size={'sm'}
                                onClick={() => handleInsertSnippet(snippet)}
                            >
                                Insert Code
                            </Button>
                        </div>
                    ))
                ) : (
                    <EmptyList
                        icon={<FunctionSquare />}
                        title={globalFilter ? "No matching snippets" : "No Snippets"}
                        description={globalFilter ? "Try adjusting your search terms" : "Create your first custom Snnippt to add functionality to your page!"}
                        className="py-12"
                    />
                )}
            </div>
        </div>
    );
};

const TabsFunctions = ({
    functions,
    currentFunction,
    editorRef,
    onInsertImport,
    globalFilter,
}: TabFunctionsProps) => {
    const filteredFunctions = useMemo(() => {
        let filtered = currentFunction
            ? functions.filter((funct) => funct.id !== currentFunction.id)
            : functions;

        if (globalFilter) {
            filtered = filtered.filter(funct => 
                (funct.name?.toLowerCase() || '').includes(globalFilter.toLowerCase()) ||
                (funct.returnValue?.type?.toLowerCase() || '').includes(globalFilter.toLowerCase())
            );
        }

        return filtered;
    }, [functions, currentFunction, globalFilter]);

    const handleInsertFunction = (funct: CustomFunctionConfig) => {
        if (editorRef && editorRef.current) {
            let code = funct.code;
            if ((funct.id || !code ) && funct.name) {
                code = `${funct.name}();`;
            }
            editorRef.current.insertTextAtCursor(code);
            if (funct.path)
                onInsertImport?.({
                    namespace: `import {${funct.name}} from '${funct.path}'`,
                    id: getId(),
                });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2">
                {filteredFunctions.length > 0 ? (
                    filteredFunctions.map((funct, index) => (
                        <div
                            key={index}
                            className="flex justify-between items-center w-full border p-2 rounded hover:bg-accent hover:text-accent-foreground"
                        >
                            <div className="flex items-center space-x-2">
                                <span className="font-medium">{funct.name}</span>
                                <span className="text-gray-400 text-sm">
                                    {funct.returnValue?.type}
                                </span>
                            </div>
                            <Button
                                size={'sm'}
                                variant="outline"
                                onClick={() => {
                                    handleInsertFunction(funct);
                                }}
                            >
                                Insert Code
                            </Button>
                        </div>
                    ))
                ) : (
                    <EmptyList
                        icon={<FunctionSquare />}
                        title={globalFilter ? "No matching functions" : "No Functions"}
                        description={globalFilter ? "Try adjusting your search terms" : "Create your first custom functions to add functionality to your page!"}
                        className="py-12"
                    />
                )}
            </div>
        </div>
    );
};

export { TabStates, TabSnipptes, TabsFunctions };
