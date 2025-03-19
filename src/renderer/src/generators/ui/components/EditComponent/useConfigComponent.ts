
const useConfigComponent = (_componetName: string) => {

    const bootstrapWidths = Array.from({ length: 12 }, (_, index) => ({
        value: index + 1,
        label: `col-${index + 1}`
    }));

    const propsConfig = {
        hasTitle: {
            type: 'boolean',
            label: 'Has Title',
            defaultValue: true
        },
        title: {
            type: 'text',
            label: 'Title'
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