import CodeMirror from '@uiw/react-codemirror';
import { useDroppedComponents } from '../dnd/DroppedComponentsContext';
import { Component } from '@igrp/nextjs-engine/dist/interfaces/types';
import { buildJsonStructure } from '@renderer/utils/jsonStructureUtil';
import { ScrollBar } from '@renderer/components/ui/scroll-area';

const CodeMirrorContent = () => {
    const { getAllComponents } = useDroppedComponents();
    const components = getAllComponents();

    const jsonStructure: Component[] = buildJsonStructure(components);

    const code = JSON.stringify(jsonStructure, null, 2);

    return (
        <ScrollBar id="code-mirror" className="h-100">
            <CodeMirror value={code} height="auto" />
        </ScrollBar>
    );
};

export default CodeMirrorContent;
