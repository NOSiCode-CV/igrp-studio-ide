
const useConfigComponent = (componetName: string) => {

    const bootstrapWidths = Array.from({ length: 12 }, (_, index) => ({
        value: index + 1,
        label: `col-${index + 1}`
    }));

    const propsConfig = {
        title: {
            type: 'text',
            label: 'Title'
        },
        hasTitle: {
            type: 'boolean',
            label: 'Has Title',
            defaultValue: true
        },
        colSize: {
            type: 'select',
            label: 'Size',
            defaultValue: 4,
            options: bootstrapWidths
        }
    };

    return propsConfig;
}

export default useConfigComponent;