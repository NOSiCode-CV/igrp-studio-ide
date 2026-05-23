# GraphQL Constitution Roadmap

## Phase 1: GraphQL Manifest

Define the module-level `graphql.json` structure, operation model, type/input model, persistence location, and source-of-truth rules.

Define the module-level `graphql.json` structure, operation model, type/input model, persistence location, and rules for reading and writing the manifest.

## Phase 2: UI to JSON Mapping

Specify how the GraphQL Designer screens map visual edits for queries, mutations, subscriptions, types, inputs, and arguments into the manifest.

## Phase 3: Validation

Define validation rules for operation names, return types, input types, DTO references, GraphQL types, arguments, subscriptions, and V1 relation constraints.

## Phase 4: Generator

Specify how the engine consumes the manifest to generate `schema.graphqls`, Query resolvers, Mutation resolvers, and Subscription resolvers for Spring Boot.

Specify how the engine/generator consumes the manifest and is solely responsible for generating `schema.graphqls`, Query resolvers, Mutation resolvers, and Subscription resolvers for Spring Boot.

## Phase 5: Integration and Testing

Validate the full flow from visual editing to manifest persistence to backend generation, including compatibility with existing API Designer behavior.

Validate the full flow from visual editing to manifest persistence to backend generation, including running the generated backend and verifying GraphQL queries. 

## Phase 6: Improvements

Expand GraphQL capabilities after V1, such as richer type modeling, stronger schema previews, advanced subscriptions, better DTO mapping, and optional nested input strategies.
