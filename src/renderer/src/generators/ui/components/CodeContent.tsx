import { useDroppedComponents } from '../dnd/DroppedComponentsContext';
import { Component } from '@igrp/nextjs-engine/dist/interfaces/types';
import { buildJsonStructure } from '@renderer/utils/jsonStructureUtil';
import MonacoEditor from '@renderer/components/MonacoEditor';

const CodeContent = (pagePath) => {
    const { getAllComponents } = useDroppedComponents();
    const components = getAllComponents();

   // const jsonStructure: Component[] = buildJsonStructure(components);

    const code = JSON.stringify(components, null, 2);

    return <MonacoEditor /* filePath={pagePath} */ content={code} />;
};

export default CodeContent;
