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
}

export interface RelationData {
  from: string
  to: string
  text: string
  toText: string
}
