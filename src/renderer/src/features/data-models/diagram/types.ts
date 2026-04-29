export interface Attribute {
    name: string
    iskey: boolean
    figure: string
    color: string
}

export interface ModelData {
    key: string
    name: string
    items: Attribute[]
    inheritedItems: Attribute[]
    /** Optional gojs location string, e.g. "120 240". Restored on render. */
    loc?: string
}

export interface RelationData {
    from: string
    to: string
    text: string
    toText: string
}
