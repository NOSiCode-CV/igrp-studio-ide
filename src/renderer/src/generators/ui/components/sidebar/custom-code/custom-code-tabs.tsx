import {
    CustomFunctionConfig,
    Import,
    State,
} from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { EmptyList } from '@renderer/components/empty-list';
import { Button } from '@renderer/components/ui/button';
import { getId } from '@renderer/utils/helpers';
import { FunctionSquare } from 'lucide-react';

interface TabStatesProps {
    states: State[];
    editorRef?: React.RefObject<any>;
}

interface TabFunctionsProps {
    functions: CustomFunctionConfig[];
    currentFunction?: CustomFunctionConfig;
    editorRef?: React.RefObject<any>;
    onInsertImport?: (importObj: Import) => void;
}

interface TabSnippetsProps {
    snippets: any[];
    editorRef?: React.RefObject<any>;
}
function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const TabStates = ({ states, editorRef }: TabStatesProps) => {
    const handleInsertState = (state: State) => {
        if (editorRef && editorRef.current) {
            const textToInsert = `set${capitalizeFirstLetter(state.name)}(${state.defaultValue || 'null'});\n`;
            editorRef.current.insertTextAtCursor(textToInsert);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            {states.length > 0 ? (
                states.map((state, index) => (
                    <div
                        key={index}
                        className="flex justify-between items-center w-full border p-2 rounded hover:bg-accent hover:text-accent-foreground"
                    >
                        <div className="flex items-center space-x-2">
                            <span className="font-medium">{state.name}</span>
                            <span className="text-gray-400 text-sm">
                                {state.type}
                            </span>
                        </div>
                        <Button
                            size={'sm'}
                            variant="outline"
                            onClick={() => {
                                handleInsertState(state);
                            }}
                        >
                            Insert State
                        </Button>
                    </div>
                ))
            ) : (
                <EmptyList
                    icon={<FunctionSquare />}
                    title="No States"
                    description="Create your first custom state to add functionality to your page!"
                    className="py-12"
                />
            )}
        </div>
    );
};

const TabSnipptes = ({ snippets, editorRef }: TabSnippetsProps) => {
    const handleInsertSnippet = (snippet: any) => {
        if (editorRef && editorRef.current) {
            editorRef.current.insertTextAtCursor(snippet.code);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            {snippets.length > 0 ? (
                snippets.map((snippet, index) => (
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
                    title="No Snippets"
                    description="Create your first custom Snnippt to add functionality to your page!"
                    className="py-12"
                />
            )}
        </div>
    );
};

const TabsFunctions = ({
    functions,
    currentFunction,
    editorRef,
    onInsertImport,
}: TabFunctionsProps) => {
    const handleInsertFunction = (funct: CustomFunctionConfig) => {
        if (editorRef && editorRef.current) {
            let code = funct.code;
            if (!code && funct.name) {
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

    const filteredFunctions = currentFunction
        ? functions.filter((funct) => funct.id !== currentFunction.id)
        : functions;
    return (
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
                    title="No Functions"
                    description="Create your first custom functions to add functionality to your page!"
                    className="py-12"
                />
            )}
        </div>
    );
};

export { TabStates, TabSnipptes, TabsFunctions };
