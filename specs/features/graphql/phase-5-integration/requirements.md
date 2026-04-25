# Phase 5: GraphQL Integration Requirements

## Objective

Validate the complete iGRP Studio GraphQL flow from visual editing to backend generation while preserving compatibility with the existing API Designer and module architecture.

Target flow:

```txt
UI -> JSON manifest -> validation -> generator -> Spring Boot GraphQL backend
```

## Scope

### Full Flow Integration

Phase 5 connects the previously specified pieces:

- UI mapping from Phase 2
- manifest contract from Phase 1
- advanced validation from Phase 3
- generator output from Phase 4

Phase 5 owns orchestration: it defines when structural validation, reference validation, and generation are triggered in the complete flow.

### API Designer Integration

GraphQL must integrate into the current API Designer module workflow without disrupting existing REST endpoints, DTOs, schemas, models, or enums.

### Backend Integration

Generated GraphQL artifacts must be included in the backend project structure in a way that allows the target Spring Boot backend to run with GraphQL enabled.

### Compatibility

Existing modules without GraphQL manifests must continue to work unchanged.

## Out of Scope

- New GraphQL modeling features beyond V1
- Advanced subscription infrastructure
- Authorization runtime policies
- Production resolver business logic
- UI redesign outside the GraphQL Designer area

## Constraints

- Existing REST API Designer behavior must not regress.
- Existing generator behavior must remain compatible.
- GraphQL must remain module-scoped.
- Invalid manifests must block generation.
- Integration errors must be structured and actionable.
