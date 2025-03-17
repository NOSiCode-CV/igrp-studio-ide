import { useDroppedComponents } from '../dnd/DroppedComponentsContext';
import MonacoEditor from '@renderer/components/monaco-editor';

const CodeContent = (_pagePath) => {
    const { getAllComponents } = useDroppedComponents();
    const components = getAllComponents();

   // const jsonStructure: Component[] = buildJsonStructure(components);

    const code = JSON.stringify(components, null, 2);

    return <MonacoEditor /* filePath={pagePath} */ content={code} />;
};

export default CodeContent;
