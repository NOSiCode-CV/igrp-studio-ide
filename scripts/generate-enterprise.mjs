/**
 * Enterprise generation driver (standalone Node, no jest VM).
 *
 * Loads `@igrp/dotnet-engine`'s CJS build via createRequire and drives the same
 * operations DotNetEngine (the Studio adapter) does, replicating its
 * createProject logic (deriveApiName + production-mode + BaseApiConfig). Emits a
 * full "enterprise" project covering every artifact type plus edit/dup/delete.
 *
 * Usage:  node scripts/generate-enterprise.mjs [outDir]
 */
import { createRequire } from 'module'
import fs from 'fs'
import os from 'os'
import path from 'path'

const require = createRequire(import.meta.url)
const engine = require('@igrp/dotnet-engine')

const {
    setEngineConfiguration,
    loadEngineConfiguration,
    newApi,
    addModule,
    addModel,
    addDTO,
    addEnum,
    addController,
    addResponse,
    addPermission,
    addGraphQLSchema,
    deleteElement
} = engine

const OUT_DIR =
    process.argv[2] ||
    process.env.ENTERPRISE_OUT ||
    path.join(os.tmpdir(), 'igrp-enterprise-audit')

const IGRP_CORE_VERSION = '0.0.1-alpha.24'

const log = (m) => console.log(`[enterprise] ${m}`)

// --- replicate DotNetEngine.deriveApiName -------------------------------
const deriveApiName = (artifact, projectName) => {
    for (const candidate of [projectName, artifact]) {
        if (!candidate) continue
        const cleaned = candidate.replace(/[^A-Za-z0-9_]/g, '')
        if (cleaned && /^[A-Za-z]/.test(cleaned)) return cleaned
    }
    throw new Error(`Cannot derive apiName from artifact "${artifact}".`)
}

const ensureProductionMode = () => {
    setEngineConfiguration({ environment: 'production' })
    loadEngineConfiguration()
}

async function main() {
    if (fs.existsSync(OUT_DIR)) fs.rmSync(OUT_DIR, { recursive: true, force: true })
    fs.mkdirSync(OUT_DIR, { recursive: true })
    log(`output dir: ${OUT_DIR}`)

    ensureProductionMode()

    // 1. PROJECT ----------------------------------------------------------
    const cfg = {
        artifact: 'enterprise-portal',
        database: 'Postgresql',
        description: 'Enterprise portal generated for the dotnet integration audit',
        projectStructureStyle: 'technical',
        name: 'Enterprise Portal',
        enableObservability: true,
        enableEntityRevision: true
    }
    const baseConfig = {
        type: 'dotnet',
        apiName: deriveApiName(cfg.artifact, cfg.name),
        artifact: cfg.artifact,
        database: cfg.database,
        description: cfg.description,
        projectStructureStyle: cfg.projectStructureStyle,
        enableObservability: !!cfg.enableObservability,
        enableEntityRevision: !!cfg.enableEntityRevision,
        igrpCoreVersion: IGRP_CORE_VERSION
    }
    await newApi(baseConfig, OUT_DIR)
    log(`project created (apiName=${baseConfig.apiName})`)

    // 2. MODULES ----------------------------------------------------------
    for (const name of ['Hr', 'Catalog', 'Fleet', 'Inventory']) {
        await addModule({ type: 'module', name }, OUT_DIR)
    }
    log('modules created')

    // 3. ENUMS ------------------------------------------------------------
    await addEnum(
        {
            type: 'enum',
            name: 'EmployeeStatus',
            module: 'Hr',
            values: [
                { name: 'ACTIVE', attributes: ['1', 'Active'] },
                { name: 'INACTIVE', attributes: ['0', 'Inactive'] },
                { name: 'ON_LEAVE', attributes: ['2', 'On leave'] }
            ],
            attributes: [
                { name: 'code', type: 'string' },
                { name: 'description', type: 'string' }
            ]
        },
        OUT_DIR
    )
    await addEnum(
        {
            type: 'enum',
            name: 'Currency',
            global: true,
            values: [
                { name: 'EUR', attributes: ['978', 'Euro'] },
                { name: 'USD', attributes: ['840', 'US Dollar'] },
                { name: 'CVE', attributes: ['132', 'Cape Verde Escudo'] }
            ],
            attributes: [
                { name: 'numericCode', type: 'string' },
                { name: 'label', type: 'string' }
            ]
        },
        OUT_DIR
    )
    log('enums created')

    // 4. MODELS -----------------------------------------------------------
    const department = {
        type: 'model',
        module: 'Hr',
        name: 'Department',
        tableName: 'departments',
        audit: false,
        crud: true,
        primaryKey: [],
        uniqueConstraints: [{ name: 'uq_department_code', columns: ['code'] }],
        indexes: [{ name: 'ix_department_name', columns: ['name'], unique: false }],
        attributes: [
            { name: 'id', type: 'integer', nullable: false, unique: true, primaryKey: true, generationType: 'Identity' },
            { name: 'name', type: 'string', length: 120, nullable: false, unique: false },
            { name: 'code', type: 'string', length: 20, nullable: false, unique: true }
        ]
    }
    const employee = {
        type: 'model',
        module: 'Hr',
        name: 'Employee',
        tableName: 'employees',
        audit: true,
        crud: true,
        primaryKey: [],
        attributes: [
            { name: 'id', type: 'integer', nullable: false, unique: true, primaryKey: true, generationType: 'Identity' },
            { name: 'firstName', type: 'string', length: 80, nullable: false, unique: false },
            { name: 'lastName', type: 'string', length: 80, nullable: false, unique: false },
            { name: 'email', type: 'string', length: 160, nullable: false, unique: true, isEmail: true },
            { name: 'salary', type: 'decimal', precision: 12, scale: 2, nullable: true, unique: false },
            { name: 'active', type: 'boolean', nullable: false, unique: false, defaultValue: 'true' },
            { name: 'hireDate', type: 'date', nullable: true, unique: false },
            { name: 'department', type: 'relation', nullable: true, unique: false, relation: { type: 'ManyToOne', entity: 'Department', cardinality: 'twoWay', module: 'Hr' } }
        ]
    }
    const category = {
        type: 'model',
        module: 'Catalog',
        name: 'Category',
        tableName: 'categories',
        audit: false,
        crud: true,
        primaryKey: [],
        attributes: [
            { name: 'id', type: 'integer', nullable: false, unique: true, primaryKey: true, generationType: 'Identity' },
            { name: 'label', type: 'string', length: 100, nullable: false, unique: false }
        ]
    }
    const tag = {
        type: 'model',
        module: 'Catalog',
        name: 'Tag',
        tableName: 'tags',
        audit: false,
        crud: true,
        primaryKey: [],
        attributes: [
            { name: 'id', type: 'integer', nullable: false, unique: true, primaryKey: true, generationType: 'Identity' },
            { name: 'name', type: 'string', length: 60, nullable: false, unique: true }
        ]
    }
    const product = {
        type: 'model',
        module: 'Catalog',
        name: 'Product',
        tableName: 'products',
        audit: true,
        crud: true,
        primaryKey: [],
        attributes: [
            { name: 'id', type: 'integer', nullable: false, unique: true, primaryKey: true, generationType: 'Identity' },
            { name: 'name', type: 'string', length: 160, nullable: false, unique: false },
            { name: 'price', type: 'decimal', precision: 12, scale: 2, nullable: false, unique: false },
            { name: 'description', type: 'string', length: 500, nullable: true, unique: false },
            { name: 'category', type: 'relation', nullable: true, unique: false, relation: { type: 'ManyToOne', entity: 'Category', cardinality: 'twoWay', module: 'Catalog' } },
            { name: 'tags', type: 'relation', nullable: true, unique: false, relation: { type: 'ManyToMany', entity: 'Tag', joinTable: 'product_tags', cardinality: 'oneWay', module: 'Catalog' } }
        ]
    }
    const vehicle = {
        type: 'model',
        module: 'Fleet',
        name: 'Vehicle',
        tableName: 't_vehicle',
        audit: false,
        crud: false,
        uniqueConstraints: [],
        primaryKey: [
            { name: 'id', type: 'integer' },
            { name: 'plate', type: 'biginteger' }
        ],
        attributes: [{ name: 'label', type: 'string', nullable: true, unique: false, primaryKey: false }]
    }
    for (const m of [department, employee, category, tag, product, vehicle]) {
        await addModel(m, OUT_DIR)
    }
    log('models created')

    // 5. DTOs -------------------------------------------------------------
    await addDTO({ type: 'dto', module: 'Hr', name: 'EmployeeSummary', template: 'classic', attributes: [
        { type: 'long', objectType: 'dotnet', name: 'id', primaryKey: true, required: false },
        { type: 'string', objectType: 'dotnet', name: 'fullName', required: true },
        { type: 'string', objectType: 'dotnet', name: 'email', required: true, isEmail: true }
    ] }, OUT_DIR)
    await addDTO({ type: 'dto', module: 'Hr', name: 'EmployeeRecord', template: 'record', attributes: [
        { type: 'long', objectType: 'dotnet', name: 'id', required: false },
        { type: 'string', objectType: 'dotnet', name: 'name', required: true }
    ] }, OUT_DIR)
    await addDTO({ type: 'dto', module: 'Catalog', name: 'Address', template: 'classic', attributes: [
        { type: 'string', objectType: 'dotnet', name: 'street', required: true },
        { type: 'string', objectType: 'dotnet', name: 'city', required: true }
    ] }, OUT_DIR)
    await addDTO({ type: 'dto', module: 'Catalog', name: 'CustomerProfile', template: 'classic', attributes: [
        { type: 'string', objectType: 'dotnet', name: 'name', required: true },
        { type: 'Address', objectType: 'dto', name: 'address', required: false }
    ] }, OUT_DIR)
    log('dtos created')

    // 6. RESPONSES --------------------------------------------------------
    await addResponse({ template: 'record', statusCode: '200', name: 'OperationResult', module: 'Hr', description: 'Standard operation result', content: {
        'application/json': { schema: { type: 'object', properties: {
            success: { type: 'boolean', description: 'Whether the operation succeeded' },
            message: { type: 'string', description: 'Human readable message' }
        } } }
    } }, OUT_DIR)
    await addResponse({ template: 'classic', statusCode: '200', name: 'PagedEmployees', module: 'Hr', description: 'A page of employees', content: {
        'application/json': { schema: { type: 'object', collectionType: 'pageable', properties: { items: { type: 'string', collectionType: 'list' } } } }
    } }, OUT_DIR)
    log('responses created')

    // 7. CONTROLLER -------------------------------------------------------
    await addController({
        type: 'controller',
        name: 'Reports',
        basePath: 'reports',
        module: 'Hr',
        description: 'HR reporting endpoints',
        actions: [
            { actionName: 'headcount', path: 'headcount', method: 'GET', requestParams: [{ type: 'string', name: 'unit', isRequired: false }], responses: {
                '200': { name: 'HeadcountResponse', module: 'Hr', description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { total: { type: 'integer' } } } } } }
            } },
            { actionName: 'createSnapshot', path: 'snapshots', method: 'POST', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { title: { type: 'string', required: true }, note: { type: 'string' } } } } } }, responses: {
                '201': { name: 'SnapshotCreated', module: 'Hr', description: 'Created', content: { 'application/json': { schema: { type: 'object', properties: { id: { type: 'integer' } } } } } }
            } },
            { actionName: 'updateSnapshot', path: 'snapshots', method: 'PUT', pathVariables: [{ type: 'integer', name: 'id', isRequired: true }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { title: { type: 'string' } } } } } }, responses: {
                '200': { name: 'SnapshotUpdated', module: 'Hr', description: 'Updated', content: { 'application/json': { schema: { type: 'object', properties: { updated: { type: 'boolean' } } } } } }
            } }
        ]
    }, OUT_DIR)
    log('controller created')

    // 8. PERMISSION -------------------------------------------------------
    await addPermission({
        type: 'permission',
        name: 'HrManagement',
        description: 'HR management permissions',
        endpoints: [
            { type: 'web', resource: 'employee', method: 'GET', path: 'api/hr/employees' },
            { type: 'web', resource: 'employee', method: 'POST', path: 'api/hr/employees' }
        ]
    }, OUT_DIR)
    log('permission created')

    // 9. GRAPHQL ----------------------------------------------------------
    await addDTO({ type: 'graphqlType', name: 'Item', module: 'Inventory', template: 'classic', attributes: [
        { name: 'id', type: 'uuid', objectType: 'dotnet', required: true, primaryKey: true },
        { name: 'sku', type: 'string', objectType: 'dotnet', required: true },
        { name: 'quantity', type: 'integer', objectType: 'dotnet', required: true }
    ] }, OUT_DIR)
    await addDTO({ type: 'graphqlInput', name: 'CreateItemInput', module: 'Inventory', template: 'classic', attributes: [
        { name: 'sku', type: 'string', objectType: 'dotnet', required: true, maxLength: 50 },
        { name: 'quantity', type: 'integer', objectType: 'dotnet', required: true }
    ] }, OUT_DIR)
    await addGraphQLSchema({
        type: 'graphql',
        name: 'Item',
        module: 'Inventory',
        typeRef: 'Item',
        inputRefs: ['CreateItemInput'],
        queries: [
            { name: 'findItemById', args: [{ name: 'id', type: 'uuid', nullable: false }], returnTypeRef: 'Item', collectionType: 'single' },
            { name: 'findAllItems', returnTypeRef: 'Item', collectionType: 'list' }
        ],
        mutations: [
            { name: 'createItem', inputRef: 'CreateItemInput', returnTypeRef: 'Item' },
            { name: 'deleteItem', args: [{ name: 'id', type: 'uuid', nullable: false }], returnType: 'Boolean' }
        ]
    }, OUT_DIR)
    log('graphql created')

    // 10. EDIT — re-save Category with a new attribute --------------------
    await addModel({ ...category, attributes: [...category.attributes, { name: 'slug', type: 'string', length: 120, nullable: true, unique: true }] }, OUT_DIR)
    log('edit: Category re-saved with slug')

    // 11. DUPLICATE — Department -> DepartmentCopy (replicate fixed adapter) -
    const dupContent = JSON.parse(JSON.stringify(department))
    dupContent.name = `${department.name}Copy`
    dupContent.id = `${dupContent.id || 'department'}_copy`
    // Mirror DotNetEngine.duplicate: a duplicated model needs its own table +
    // constraint/index names, or EF Core cannot build the model (two entities
    // mapped to one table) and Postgres rejects duplicate constraint names.
    if (dupContent.tableName) dupContent.tableName = `${dupContent.tableName}_copy`
    if (Array.isArray(dupContent.uniqueConstraints)) {
        dupContent.uniqueConstraints = dupContent.uniqueConstraints.map((uc) => (uc?.name ? { ...uc, name: `${uc.name}_copy` } : uc))
    }
    if (Array.isArray(dupContent.indexes)) {
        dupContent.indexes = dupContent.indexes.map((ix) => (ix?.name ? { ...ix, name: `${ix.name}_copy` } : ix))
    }
    await addModel({ ...dupContent, module: 'Hr' }, OUT_DIR)
    log('duplicate: DepartmentCopy created (table departments_copy)')

    // 12. DELETE — an unreferenced leaf DTO (Tag is referenced by Product) -
    await deleteElement({ name: 'EmployeeRecord', module: 'Hr', type: 'dto' }, OUT_DIR)
    log('delete: EmployeeRecord DTO removed')

    log('DONE')
}

main().catch((err) => {
    console.error('[enterprise] GENERATION FAILED:')
    console.error(err)
    process.exit(1)
})
