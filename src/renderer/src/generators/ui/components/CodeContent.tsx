import MonacoEditor from '@renderer/components/monaco-editor';

const CodeContentJson = (components) => {
    const code = JSON.stringify(components, null, 2);

    return <MonacoEditor language="json" content={code} />;
};



const CodeContentTS = (pagePath) => {
    console.log('pagePath', pagePath);
    return (
        <MonacoEditor language="typescript" content={''} filePath={pagePath} />
    );
};

export { CodeContentJson, CodeContentTS };
