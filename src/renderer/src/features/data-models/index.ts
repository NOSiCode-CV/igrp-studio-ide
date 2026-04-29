// Public surface of the shared `data-models` feature.
// Generators and pages MUST import from here only — never reach into subpaths.

// --- diagram ---
export { default as ERDCanvas } from './diagram/ERDCanvas'
export { convertModelData } from './diagram/convertModelData'
export {
    entitiesToDiagramModel,
    parseDiagramLoc
} from './diagram/entitiesToDiagramModel'
export { ProjectERDCanvas } from './diagram/ProjectERDCanvas'
export type { Attribute, ModelData, RelationData } from './diagram/types'

// --- connection ---
export { ConnectionForm } from './connection/ConnectionForm'
export { ConnectionManager } from './connection/ConnectionManager'
export { TablePicker } from './connection/TablePicker'

// --- canonical types ---
export type {
    Entity,
    EntitySource,
    EntitySummary,
    Field,
    FieldType,
    NodeLayout,
    Relation,
    RelationKind
} from './types/entity'

// --- hooks ---
export { useConnections } from './hooks/useConnections'
export { useDebouncedAutoSave } from './hooks/useDebouncedAutoSave'
export { useDrift } from './hooks/useDrift'
export { useEntities } from './hooks/useEntities'
export { useEntity } from './hooks/useEntity'

// --- editor ---
export { EntityEditor } from './editor/EntityEditor'
export { EntityFormModal } from './editor/EntityFormModal'
export { EntityList } from './editor/EntityList'
export { FieldsTable } from './editor/FieldsTable'
export { RelationsList } from './editor/RelationsList'

// --- import ---
export { ImportFromDbWizard } from './import/ImportFromDbWizard'

// --- chat / panel ---
export { DataChatPanel } from './chat/DataChatPanel'
export { buildDataSystemPrompt } from './chat/buildSystemPrompt'
export { DataModelsPanel } from './DataModelsPanel'
