# Phase 2: GraphQL UI Mapping Plan

## 1. Define API Designer Entry Point

Add a GraphQL section inside the existing module-oriented API Designer structure.

Tasks:

- Identify the current module navigation pattern.
- Define where GraphQL appears in the module artifact tree.
- Define overview navigation for Queries, Mutations, and Subscriptions.
- Keep GraphQL inside the API Designer layout, not in a separate product area.

## 2. Define Operation Overview Mapping

Define how the overview reads manifest operations and groups them by `operationType`.

Tasks:

- Group operations with `operationType: "query"` under Queries.
- Group operations with `operationType: "mutation"` under Mutations.
- Group operations with `operationType: "subscription"` under Subscriptions.
- Display operation `name`, `returnType`, and summary metadata.
- Use `id` as the internal key for opening, updating, and deleting items.

## 3. Define Tab-Based Editing Model

Define tab behavior consistent with DTO and endpoint editing.

Tasks:

- Open overview in a stable tab.
- Open each operation editor in a tab keyed by operation `id`.
- Preserve unsaved form state per open tab.
- Rename operation labels from `name` without changing tab identity based on `id`.

## 4. Define Query Form Mapping

Map Query form fields to manifest fields.

Tasks:

- Set `operationType` to lowercase `query`.
- Map operation name input to `name`.
- Map comment input to `comment`.
- Map parameter table rows to `args`.
- Map return type selector to `returnType`.
- Map return mode selector to `returnMode`.
- Do not persist `inputType` or `eventTopic` for queries.

## 5. Define Mutation Form Mapping

Map Mutation form fields to manifest fields.

Tasks:

- Set `operationType` to lowercase `mutation`.
- Map operation name input to `name`.
- Map comment input to `comment`.
- Map mutation input selector to `inputType`.
- Map parameter table rows to `args`.
- Map return type selector to `returnType`.
- Map return mode selector to `returnMode`.
- Do not persist `eventTopic` for mutations.

## 6. Define Subscription Form Mapping

Map Subscription form fields to manifest fields.

Tasks:

- Set `operationType` to lowercase `subscription`.
- Map operation name input to `name`.
- Map comment input to `comment`.
- Map event topic input to `eventTopic`.
- Map parameter table rows to `args`.
- Map return type selector to `returnType`.
- Map return mode selector to `returnMode`.
- Do not persist `inputType` for subscriptions.

## 7. Define Sanitization Before Persistence

Define a UI-to-manifest normalization step.

Tasks:

- Trim string values where appropriate.
- Convert operation type controls into lowercase manifest values.
- Drop transient UI state such as active tabs, local row focus, search text, and modal state.
- Keep only fields allowed by the Phase 1 manifest contract.
- Preserve operation `id` for existing operations.
- Request persistence without generating `id` in the UI; the Main service/persistence layer assigns `id` for new operations.

## 8. Define Save and Delete Behavior

Define operation persistence interactions.

Tasks:

- Save edits by operation `id`.
- Delete operations by operation `id`.
- Allow renaming by changing `name` while preserving `id`.
- Surface validation errors returned by structural or reference validation; do not perform canonical validation in the UI mapping layer.
