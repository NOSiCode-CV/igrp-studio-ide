/**
 * Deterministic Horizon/.NET cross-module acceptance fixture.
 *
 * This intentionally lives beside the existing technical and ERP stress
 * drivers. It proves the public engine contract for two real domain modules,
 * the reserved Shared bucket, cross-module relations, DTO inheritance, enum
 * fields, CRUD controllers, and custom controllers.
 *
 * Usage:
 *   node scripts/stress-cross-module.mjs <technical|domain> <Sqlite|Postgresql> <outDir>
 */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
const engine = require('@igrp/dotnet-engine')
const {
    setEngineConfiguration,
    loadEngineConfiguration,
    newApi,
    addModule,
    addModel,
    addEnum,
    addDTO,
    addController
} = engine

const [style = 'technical', database = 'Postgresql', outDir] = process.argv.slice(2)
const OUT = outDir || path.resolve('C:/tmp/horizon-cross-module-acceptance')
const log = (message) => console.log(`[cross-module:${style}] ${message}`)

const id = () => ({
    name: 'id',
    type: 'long',
    nullable: false,
    unique: true,
    primaryKey: true,
    generationType: 'Identity'
})

const stringField = (name, length, options = {}) => ({
    name,
    type: 'string',
    length,
    nullable: false,
    unique: false,
    ...options
})

const decimalField = (name, options = {}) => ({
    name,
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: false,
    unique: false,
    ...options
})

const relationField = (name, relation, options = {}) => ({
    name,
    type: 'relation',
    nullable: true,
    unique: false,
    relation,
    ...options
})

const model = (name, tableName, module, attributes) => ({
    type: 'model',
    name,
    tableName,
    module,
    crud: true,
    audit: false,
    primaryKey: [],
    uniqueConstraints: [],
    attributes
})

const relation = (type, entity, module, options = {}) => ({
    type,
    entity,
    module,
    cardinality: options.cardinality || 'oneWay',
    referencedColumnName: options.referencedColumnName || 'id',
    ...options
})

const jsonFiles = (directory) => {
    if (!fs.existsSync(directory)) return []
    return fs.readdirSync(directory)
        .filter((file) => file.endsWith('.json'))
        .map((file) => path.join(directory, file))
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))

function findGeneratedFile(root, suffix) {
    const pending = [root]
    while (pending.length > 0) {
        const current = pending.pop()
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            const fullPath = path.join(current, entry.name)
            if (entry.isDirectory()) pending.push(fullPath)
            else if (fullPath.endsWith(suffix)) return fullPath
        }
    }
    return undefined
}

function assertManifestContracts() {
    const manifestRoot = path.join(OUT, '.igrpstudio')
    const peopleModels = path.join(manifestRoot, 'people', 'models')
    const salesModels = path.join(manifestRoot, 'sales', 'models')
    const sharedDtos = path.join(manifestRoot, 'Shared', 'dto')

    const people = jsonFiles(peopleModels).map(readJson)
    const sales = jsonFiles(salesModels).map(readJson)
    assert.ok(people.some((item) => item.name === 'Customer'), 'Customer manifest missing')
    assert.ok(people.some((item) => item.name === 'Profile'), 'Profile manifest missing')
    assert.ok(people.some((item) => item.name === 'Tag'), 'Tag manifest missing')
    assert.ok(sales.some((item) => item.name === 'Order'), 'Order manifest missing')
    assert.ok(sales.some((item) => item.name === 'OrderItem'), 'OrderItem manifest missing')

    const customer = people.find((item) => item.name === 'Customer')
    const order = sales.find((item) => item.name === 'Order')
    const profile = people.find((item) => item.name === 'Profile')
    assert.ok(customer.attributes.some((item) => item.relation?.type === 'ManyToMany' && item.relation?.entity === 'Tag'), 'Customer N:N relation missing')
    assert.ok(customer.attributes.some((item) => item.relation?.type === 'OneToMany' && item.relation?.entity === 'Order' && item.relation?.module === 'sales'), 'Customer cross-module 1:N relation missing')
    assert.equal(order.attributes.find((item) => item.name === 'customer')?.relation?.module, 'people', 'Order -> Customer module metadata missing')
    assert.equal(profile.attributes.find((item) => item.name === 'customer')?.relation?.type, 'OneToOne', 'Profile 1:1 relation missing')
    assert.ok(jsonFiles(sharedDtos).some((file) => readJson(file).name === 'AuditBase'), 'Shared DTO manifest missing')

    const customerController = findGeneratedFile(OUT, `${path.sep}CustomerController.cs`)
    const orderController = findGeneratedFile(OUT, `${path.sep}OrderController.cs`)
    const peopleController = findGeneratedFile(OUT, `${path.sep}PeopleController.cs`)
    const salesController = findGeneratedFile(OUT, `${path.sep}SalesController.cs`)
    assert.ok(customerController, 'Customer CRUD controller missing')
    assert.ok(orderController, 'Order CRUD controller missing')
    assert.ok(peopleController, 'People custom controller missing')
    assert.ok(salesController, 'Sales custom controller missing')

    const generatedSources = [customerController, orderController, peopleController, salesController]
        .map((file) => fs.readFileSync(file, 'utf8'))
        .join('\n')
    assert.match(generatedSources, /Route\(/, 'Generated controller routes missing')
    log('manifest and generated controller contracts verified')
}

setEngineConfiguration({ environment: 'production' })
loadEngineConfiguration()

async function main() {
    if (fs.existsSync(OUT)) {
        const marker = path.join(OUT, '.horizon-cross-module-fixture')
        if (!fs.existsSync(marker)) {
            throw new Error(`Refusing to overwrite an unmarked output directory: ${OUT}`)
        }
        fs.rmSync(OUT, { recursive: true, force: true })
    }
    fs.mkdirSync(OUT, { recursive: true })
    log(`out=${OUT}`)

    await newApi({
        type: 'dotnet',
        apiName: 'CrossModuleAcceptanceApi',
        artifact: 'cross-module-acceptance-api',
        description: 'Horizon cross-module acceptance fixture',
        database,
        projectStructureStyle: style,
        enableObservability: true,
        enableEntityRevision: true,
        enableGraphQL: true,
        igrpCoreVersion: '0.0.1-test'
    }, OUT)
    fs.writeFileSync(path.join(OUT, '.horizon-cross-module-fixture'), 'generated by scripts/stress-cross-module.mjs\n')

    await addModule({ type: 'module', name: 'people' }, OUT)
    await addModule({ type: 'module', name: 'sales' }, OUT)

    await addEnum({
        type: 'enum',
        name: 'OrderStatus',
        module: 'shared',
        values: [{ name: 'Draft' }, { name: 'Confirmed' }, { name: 'Paid' }]
    }, OUT)

    await addDTO({
        type: 'dto',
        name: 'AuditBase',
        module: 'shared',
        template: 'classic',
        attributes: [{ type: 'string', objectType: 'dotnet', name: 'createdBy', required: true }]
    }, OUT)
    await addDTO({
        type: 'dto',
        name: 'OrderSummary',
        module: 'sales',
        template: 'classic',
        extends: { name: 'AuditBase', module: 'shared' },
        attributes: [
            { type: 'long', objectType: 'dotnet', name: 'orderId', required: true },
            { type: 'decimal', objectType: 'dotnet', name: 'total', required: true }
        ]
    }, OUT)

    await addModel(model('Customer', 't_customer', 'people', [
        id(),
        stringField('name', 160),
        stringField('email', 240, { unique: true })
    ]), OUT)

    await addModel(model('Tag', 't_tag', 'people', [
        id(),
        stringField('name', 80, { unique: true })
    ]), OUT)

    await addModel(model('Profile', 't_profile', 'people', [
        id(),
        stringField('phone', 40, { nullable: true }),
        relationField('customer', relation('OneToOne', 'Customer', 'people'))
    ]), OUT)

    await addModel(model('Order', 't_order', 'sales', [
        id(),
        stringField('number', 40, { unique: true }),
        decimalField('total'),
        { name: 'status', type: 'OrderStatus', objectType: 'enum', module: 'shared', nullable: false, unique: false },
        relationField('customer', relation('ManyToOne', 'Customer', 'people', { fetchType: 'lazy' }), { nullable: false })
    ]), OUT)

    await addModel(model('OrderItem', 't_order_item', 'sales', [
        id(),
        stringField('sku', 50),
        decimalField('quantity'),
        relationField('order', relation('ManyToOne', 'Order', 'sales'), { nullable: false })
    ]), OUT)

    // Add the inverse and join-table sides after every target model exists.
    await addModel(model('Customer', 't_customer', 'people', [
        id(),
        stringField('name', 160),
        stringField('email', 240, { unique: true }),
        relationField('orders', relation('OneToMany', 'Order', 'sales', {
            cardinality: 'twoWay',
            mappedBy: 'customer'
        })),
        relationField('tags', relation('ManyToMany', 'Tag', 'people', {
            cardinality: 'twoWay',
            joinTable: 'customer_tag',
            inverseJoinColumn: 'tag_id'
        }))
    ]), OUT)

    await addController({
        type: 'controller',
        name: 'People',
        basePath: 'people',
        module: 'people',
        actions: [{
            actionName: 'lookupCustomer',
            path: 'customers/lookup',
            method: 'GET',
            requestParams: [{ type: 'string', name: 'email', isRequired: true }],
            responses: {
                200: {
                    name: 'CustomerLookupResult',
                    module: 'people',
                    description: 'Customer lookup result',
                    content: { 'application/json': { schema: { type: 'object', properties: { found: { type: 'boolean' } } } } }
                }
            }
        }]
    }, OUT)

    await addController({
        type: 'controller',
        name: 'Sales',
        basePath: 'sales',
        module: 'sales',
        actions: [{
            actionName: 'customerOrders',
            path: 'customers/{customerId}/orders',
            method: 'GET',
            pathVariables: [{ type: 'long', name: 'customerId', isRequired: true }],
            responses: {
                200: {
                    name: 'CustomerOrdersResult',
                    module: 'sales',
                    description: 'Orders for a customer',
                    content: { 'application/json': { schema: { type: 'object', properties: { count: { type: 'integer' } } } } }
                }
            }
        }]
    }, OUT)

    assertManifestContracts()
    log('DONE')
}

main().catch((error) => {
    console.error('FAILED:', error?.stack || error?.message || error)
    process.exitCode = 1
})
