import CodeMirror from "@uiw/react-codemirror";
import { useDroppedComponents } from "../dnd/DroppedComponentsContext";
import { Component } from "@igrp/nextjs-engine/dist/interfaces/types";
import { buildJsonStructure } from "@renderer/utils/jsonStructureUtil";

const CodeMirrorContent = () => {
    const { getAllComponents } = useDroppedComponents();
    const components = getAllComponents();

    const jsonStructure: Component[] = buildJsonStructure(components);

    const code = JSON.stringify(jsonStructure, null, 2);

    return (
        <CodeMirror
            value={code}
            height="auto"
        />
    );
}

export default CodeMirrorContent;
