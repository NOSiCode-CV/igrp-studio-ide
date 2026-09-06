/**
 * Public-surface verifier for the generated cross-module fixture.
 *
 * Start the generated application first, after applying its EF migration:
 *   node scripts/verify-cross-module-runtime.mjs http://127.0.0.1:8185
 *
 * The verifier intentionally treats generated custom controllers as scaffold
 * endpoints: their route and contract must exist, while their business handler
 * is expected to return 501 until a developer implements it.
 */
import assert from 'node:assert/strict'

const baseUrl = (process.argv[2] || process.env.HORIZON_BASE_URL || 'http://127.0.0.1:8185').replace(/\/$/, '')
const suffix = Date.now().toString(36)

async function request(method, path, body) {
    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: body === undefined ? undefined : { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body)
    })
    const text = await response.text()
    let json
    try {
        json = text ? JSON.parse(text) : undefined
    } catch {
        json = undefined
    }
    return { status: response.status, json, text }
}

function expectStatus(result, expected, label) {
    assert.equal(result.status, expected, `${label}: expected ${expected}, got ${result.status}: ${result.text}`)
    console.log(`${label}: ${result.status}`)
}

async function graphql(query, variables = {}) {
    const result = await request('POST', '/graphql', { query, variables })
    expectStatus(result, 200, 'GraphQL HTTP')
    assert.ok(!result.json?.errors, `GraphQL errors: ${result.text}`)
    return result.json.data
}

async function main() {
    const health = await request('GET', '/health')
    expectStatus(health, 200, 'health')

    const openApi = await request('GET', '/swagger/v1/swagger.json')
    expectStatus(openApi, 200, 'OpenAPI')
    assert.ok(openApi.json?.paths?.['/customer'], 'OpenAPI customer path missing')
    assert.ok(openApi.json?.paths?.['/order'], 'OpenAPI order path missing')

    const tag = await request('POST', '/tag', { name: `Cross Module Tag ${suffix}` })
    expectStatus(tag, 201, 'POST tag')
    const tagId = tag.json.id

    const customer = await request('POST', '/customer', {
        name: `Cross Module Customer ${suffix}`,
        email: `cross-module-${suffix}@example.test`
    })
    expectStatus(customer, 201, 'POST customer')
    const customerId = customer.json.id

    const profile = await request('POST', '/profile', { phone: '+238 999 0000', customerId })
    expectStatus(profile, 201, 'POST profile 1:1')
    const profileId = profile.json.id

    const order = await request('POST', '/order', {
        number: `CM-${suffix}`,
        total: 123.45,
        status: 'DRAFT',
        customerId
    })
    expectStatus(order, 201, 'POST order cross-module')
    const orderId = order.json.id

    const orderItem = await request('POST', '/orderItem', {
        sku: `SKU-${suffix}`,
        quantity: 2,
        orderId
    })
    expectStatus(orderItem, 201, 'POST order item 1:N')
    const orderItemId = orderItem.json.id

    for (const [label, path] of [
        ['GET customer', `/customer/${customerId}`],
        ['GET profile', `/profile/${profileId}`],
        ['GET order', `/order/${orderId}`],
        ['GET order item', `/orderItem/${orderItemId}`]
    ]) {
        expectStatus(await request('GET', path), 200, label)
    }

    expectStatus(await request('PUT', `/order/${orderId}`, {
        number: `CM-${suffix}-UPDATED`,
        total: 200.5,
        status: 'CONFIRMED',
        customerId
    }), 200, 'PUT order')

    expectStatus(await request('POST', '/customer', {
        name: `Duplicate ${suffix}`,
        email: customer.json.email
    }), 409, 'unique email conflict')
    expectStatus(await request('POST', '/customer', { name: `Invalid ${suffix}` }), 400, 'invalid customer')
    expectStatus(await request('GET', '/customer/999999999'), 404, 'missing customer')

    expectStatus(await request('GET', `/people/customers/lookup?email=${encodeURIComponent(customer.json.email)}`), 501, 'custom People scaffold')
    expectStatus(await request('GET', `/sales/customers/${customerId}/orders`), 501, 'custom Sales scaffold')

    const gqlCustomer = await graphql(
        'mutation($input: CustomerCreateInput!) { createCustomer(input: $input) { id name email tagsIds ordersIds } }',
        { input: { name: `GraphQL Customer ${suffix}`, email: `graphql-${suffix}@example.test`, tagsIds: [tagId], ordersIds: [] } }
    )
    const gqlCustomerId = gqlCustomer.createCustomer.id

    const gqlOrder = await graphql(
        'mutation($input: OrderCreateInput!) { createOrder(input: $input) { id number total status customerId } }',
        { input: { number: `GQL-${suffix}`, total: 88.25, status: 'DRAFT', customerId: gqlCustomerId } }
    )
    const gqlOrderId = gqlOrder.createOrder.id

    const gqlRead = await graphql(
        'query($id: Long!) { customer(id: $id) { id name email tagsIds ordersIds } }',
        { id: gqlCustomerId }
    )
    assert.ok(gqlRead.customer.tagsIds.includes(tagId), 'GraphQL N:N tag relation was not persisted')
    assert.ok(gqlRead.customer.ordersIds.includes(gqlOrderId), 'GraphQL 1:N relation was not persisted')
    console.log('GraphQL relation read: 200')

    const gqlUpdate = await graphql(
        'mutation($id: Long!, $input: CustomerUpdateInput!) { updateCustomer(id: $id, input: $input) { id name email tagsIds ordersIds } }',
        { id: gqlCustomerId, input: { name: `GraphQL Updated ${suffix}`, email: `graphql-updated-${suffix}@example.test`, tagsIds: [tagId], ordersIds: [gqlOrderId] } }
    )
    assert.equal(gqlUpdate.updateCustomer.name, `GraphQL Updated ${suffix}`)
    console.log('GraphQL update: 200')

    const gqlDeleteOrder = await graphql('mutation($id: Long!) { deleteOrder(id: $id) }', { id: gqlOrderId })
    assert.equal(gqlDeleteOrder.deleteOrder, true)
    const gqlDeleteCustomer = await graphql('mutation($id: Long!) { deleteCustomer(id: $id) }', { id: gqlCustomerId })
    assert.equal(gqlDeleteCustomer.deleteCustomer, true)
    console.log('GraphQL create/read/update/delete: 200')

    for (const [label, path] of [
        ['DELETE order item', `/orderItem/${orderItemId}`],
        ['DELETE order', `/order/${orderId}`],
        ['DELETE profile', `/profile/${profileId}`],
        ['DELETE customer', `/customer/${customerId}`],
        ['DELETE tag', `/tag/${tagId}`]
    ]) {
        expectStatus(await request('DELETE', path), 204, label)
    }

    console.log('CROSS_MODULE_RUNTIME_PASS')
}

main().catch((error) => {
    console.error('CROSS_MODULE_RUNTIME_FAIL:', error?.stack || error?.message || error)
    process.exitCode = 1
})
