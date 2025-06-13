import MonacoEditor from '@renderer/components/monaco-editor';

const CodeContentJson = ({ components, pagePath }: any) => {
    const code = JSON.stringify(components, null, 2);
    return <MonacoEditor language="json" content={code} filePath={pagePath} />;
};

const CodeContentTS = ({ pagePath }: { pagePath: string }) => {
    return (
        <MonacoEditor language="typescript" content={''} filePath={pagePath} />
    );
};

export { CodeContentJson, CodeContentTS };
