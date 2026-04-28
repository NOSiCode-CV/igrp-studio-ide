/**
 * Document templates available when creating a new spec file.
 * The `Blank` template is always first; the rest are starting points the user
 * fleshes out (helped by the AIAssistant + KB context).
 */

export interface DocTemplate {
    id: string
    name: string
    description: string
    suggestedFilename: string
    content: string
}

export const DOC_TEMPLATES: DocTemplate[] = [
    {
        id: 'blank',
        name: 'Blank',
        description: 'Empty document.',
        suggestedFilename: 'Untitled.md',
        content: ''
    },
    {
        id: 'prd',
        name: 'Product Requirements (PRD)',
        description: 'Problem, users, requirements, success metrics.',
        suggestedFilename: 'PRD.md',
        content: `# Product Requirements

## Problem
Describe the problem this product solves.

## Target users
Primary personas and their goals.

## Goals
-
-

## Non-goals
-

## Functional requirements
-

## Non-functional requirements
- Performance:
- Security:
- Accessibility:

## Success metrics
-

## Open questions
-
`
    },
    {
        id: 'user-stories',
        name: 'User Stories',
        description: 'As a / I want / So that — with acceptance criteria.',
        suggestedFilename: 'UserStories.md',
        content: `# User Stories

## Story: <short title>

**As a** <persona>,
**I want** <capability>,
**so that** <benefit>.

### Acceptance criteria
- [ ] Given <context>, when <action>, then <outcome>.
- [ ]
`
    },
    {
        id: 'architecture',
        name: 'Architecture',
        description: 'Overview, components, data flow, decisions.',
        suggestedFilename: 'Architecture.md',
        content: `# Architecture

## Overview
High-level summary of the system.

## Components
- **<Component>** — responsibility.

## Data flow
1.
2.

## Storage
-

## External integrations
-

## Key decisions
| Decision | Rationale |
|---|---|
|  |  |

## Risks
-
`
    },
    {
        id: 'api-spec',
        name: 'API Specification',
        description: 'Resources, endpoints, payloads, errors.',
        suggestedFilename: 'API.md',
        content: `# API Specification

## Conventions
- Base URL:
- Auth:
- Errors:

## Resources

### \`<Resource>\`

#### GET /<resource>
- Query params:
- Response:
\`\`\`json
{}
\`\`\`

#### POST /<resource>
- Body:
\`\`\`json
{}
\`\`\`
- Response:
\`\`\`json
{}
\`\`\`
`
    },
    {
        id: 'data-model',
        name: 'Data Model',
        description: 'Entities, fields, relationships.',
        suggestedFilename: 'DataModel.md',
        content: `# Data Model

## Entity: \`<Name>\`
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| createdAt | timestamp | |

### Relationships
-

## Diagram
\`\`\`mermaid
erDiagram
  ENTITY ||--o{ OTHER : has
\`\`\`
`
    }
]

export function findTemplate(id: string): DocTemplate {
    return DOC_TEMPLATES.find((t) => t.id === id) ?? DOC_TEMPLATES[0]
}
