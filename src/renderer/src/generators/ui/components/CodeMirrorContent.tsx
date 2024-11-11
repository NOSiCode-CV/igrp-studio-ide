import CodeMirror from "@uiw/react-codemirror";
import { useDroppedComponents } from "../dnd/DroppedComponentsContext";
import { Component } from "@igrp/nextjs-engine/dist/interfaces/types";
import { buildJsonStructure } from "@renderer/utils/jsonStructureUtil";
import { ScrollArea } from "@radix-ui/react-scroll-area";

const CodeMirrorContent = () => {
    const { getAllComponents } = useDroppedComponents();
    const components = getAllComponents();

    const jsonStructure: Component[] = buildJsonStructure(components);

    const code = JSON.stringify(jsonStructure, null, 2);

    return (
        <ScrollArea id="code-mirror" className="h-100">
            <CodeMirror
                value={code}
                height="auto"
            />
        </ScrollArea>
    );
}

export default CodeMirrorContent;
