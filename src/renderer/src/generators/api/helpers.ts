export function formatMethods(elements: string[]): { label: string; value: string }[] {
    return elements.map((element) => ({
        label: element,
        value: element
    }))
}
