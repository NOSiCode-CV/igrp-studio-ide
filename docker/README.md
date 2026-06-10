# Demoteste IGRP Workspace

## What This Workspace Is

This repository is a reference IGRP workspace.

It is meant to be used in two ways:

- as the local development environment for the `demoteste` project
- as a template for future IGRP workspaces

The workspace brings together:

- the shared IGRP platform infrastructure
- the process stack
- the monitoring stack
- local application projects generated or maintained under `projects/`

The key idea is simple:

- infrastructure is shared
- applications are isolated by project
- all access is centralized through the same local platform

## What A New Team Member Should Know First

If you are new to this workspace, keep these points in mind:

1. The workspace is not just one application.
   It is a local platform that hosts several services and projects together.

2. Everything starts from the root stack.
   The root stack creates the shared infrastructure used by the rest of the environment.

3. Projects under `projects/` are not part of the root compose.
   Each project has its own compose file and attaches to the shared workspace infrastructure.

4. The process stack and monitoring stack are separate.
   They depend on the root environment being available first.

5. HTTP traffic always enters through `Nginx`.
   Frontends are published under `/apps/...` and Spring APIs are accessed through `/gateway-api/...`.

6. The workspace supports two authentication modes.
   You run the full environment either with `Keycloak` or with `Autentika`, not both at the same time.

## Workspace Layout

```text
demoteste/
|-- .igrpstudio/                    # Internal workspace artifacts generated/used by IGRP Studio
|-- logs/                           # Local logs
|-- monitoring/                     # Monitoring stack
|-- process/                        # Process stack
|-- projects/                       # Local projects
|-- .env                            # Root environment for Keycloak mode
|-- .igrp-autentika.env             # Root environment for Autentika mode
|-- igrp-compose.yaml               # Root stack with Keycloak
|-- igrp-autentika-compose.yaml     # Root stack with Autentika
|-- nginx.conf                      # Central reverse proxy
|-- redis.conf                      # Redis configuration
`-- README.md
```

## Main Stacks

### Root stack

The root stack is the shared platform layer.

Key files:

- `igrp-compose.yaml`
- `igrp-autentika-compose.yaml`

Typical services:

- `demoteste-nginx`
- `demoteste-database-postgres`
- `demoteste-eureka`
- `demoteste-gateway`
- `demoteste-iam-keycloak` in Keycloak mode only
- `demoteste-access-management`
- `demoteste-application-center`
- `demoteste-redis`
- `demoteste-minio`
- `demoteste-pgadmin`

### Process stack

The process stack extends the platform with process APIs and frontends.

Key files:

- `process/igrp-process-compose.yaml`
- `process/igrp-process-autentika-compose.yaml`

Typical services:

- `demoteste-process-management-api`
- `demoteste-process-studio-api`
- `igrp-process-management`
- `igrp-process-studio`

### Monitoring stack

The monitoring stack provides observability for the full environment.

Key file:

- `monitoring/igrp-monitoring-compose.yaml`

Typical services:

- `demoteste-otel-collector`
- `demoteste-prometheus`
- `demoteste-loki`
- `demoteste-tempo`
- `demoteste-grafana`
- `demoteste-cadvisor`

### Project stacks

Each project under `projects/` has its own compose for workspace mode.

Examples:

- `projects/utente/igrp-compose-utente.yaml`
- `projects/theque/igrp-compose-theque.yaml`
- `projects/simple/igrp-compose-simple.yaml`
- `projects/bibliotheque/igrp-compose-bibliotheque.yaml`

These project stacks plug into the shared workspace network and infrastructure.

## How Requests Flow

### Frontend flow

All browser traffic enters through `Nginx`.

Typical routes:

- `/` -> Application Center
- `/auth` -> Keycloak in Keycloak mode
- `/apps/<app>` -> frontend applications
- `/pgadmin` -> PgAdmin
- `/grafana` -> Grafana
- `/minio` -> MinIO
- `/eureka` -> Eureka dashboard

### Backend flow

Spring APIs should be exposed and consumed through the API Gateway.

Expected path:

1. request enters `Nginx`
2. `Nginx` forwards `/gateway-api/*`
3. `gateway-api` resolves the target service using `Eureka`
4. request reaches the correct Spring backend

This is a core workspace rule and should be preserved in future workspaces.

### Service discovery

Spring backend services register in `Eureka`.

This lets the gateway route dynamically and avoids hardcoding backend endpoints into the reverse proxy.

## Authentication Modes

The workspace supports two mutually exclusive authentication modes.

### Keycloak mode

Files:

- `.env`
- `igrp-compose.yaml`
- `process/.env_process`
- `process/igrp-process-compose.yaml`

Default:

- `AUTH_PROVIDER=keycloak`

Frontend rule:

- frontend services receive `AUTH_PROVIDER=${AUTH_PROVIDER}`
- frontend services still use `KEYCLOAK_*` variables

### Autentika mode

Files:

- `.igrp-autentika.env`
- `igrp-autentika-compose.yaml`
- `process/.env_process_autentika`
- `process/igrp-process-autentika-compose.yaml`

Default:

- `AUTH_PROVIDER=autentika`

Frontend rule:

- frontend services receive `AUTH_PROVIDER=${AUTH_PROVIDER}`
- frontend services use:
  - `AUTH_PROVIDER`
  - `AUTENTIKA_CLIENT_ID`
  - `AUTENTIKA_CLIENT_SECRET`
  - `AUTENTIKA_HOST`
  - `AUTENTIKA_SCOPES`

Backend rule:

- Spring backend services keep authentication reduced to:
  - `AUTH_JWT_ISSUER=${AUTENTIKA_ISSUER}`

## Environment Files

### Root env files

- `.env`
- `.igrp-autentika.env`

These hold shared runtime values such as:

- HTTP port
- database host and credentials
- MinIO settings
- Eureka URL
- authentication mode
- Access Management settings
- Application Center settings

### Process env files

- `process/.env_process`
- `process/.env_process_autentika`

These hold process-specific values such as:

- process database names
- Spring profile
- logging
- OpenTelemetry settings
- mail settings
- M2M sync values
- authentication mode

### Project env files

Examples:

- `projects/utente/.igrp.utente.env`
- `projects/theque/.igrp.theque.env`
- `projects/simple/.igrp.simple.env`
- `projects/bibliotheque/.igrp.bibliotheque.env`

These are project-specific values used by the project compose files.

## The `projects/` Directory

The `projects/` folder is where application projects live.

Each project may support up to three execution contexts:

- workspace mode
- standalone Docker mode
- Kubernetes mode

### Workspace mode

Uses `igrp-compose-<project>.yaml`.

The project runs attached to the root workspace infrastructure.

### Standalone mode

Uses the project's own `docker-compose.yml`.

This is for isolated execution of that project only.

### Kubernetes mode

Uses manifests under `k8s/`.

This is for cluster deployment, outside the local workspace runtime.

## Database Initialization Model

The workspace uses dedicated bootstrap tasks for databases that must exist before a service starts.

Pattern:

1. PostgreSQL starts
2. a transient `*-db-prepare` service creates the required database if needed
3. the main service waits for that bootstrap task to complete successfully

Examples:

- `demoteste-iam-db-prepare`
- `demoteste-access-management-db-prepare`
- `demoteste-process-management-db-prepare`
- `demoteste-process-studio-db-prepare`
- `simple-db-prepare`
- `bibliotheque-db-prepare`

These are infrastructure helpers, not domain services.

## Readiness and Warmup

The workspace separates technical readiness from functional warmup.

### Technical readiness

Handled through Docker `healthcheck`.

Examples:

- Keycloak is considered ready only when the OpenID discovery endpoint of the `igrp` realm is available
- Access Management uses `/actuator/health`
- Application Center depends on `demoteste-access-management: service_healthy`

### Functional warmup

Some frontends need an initial call so that menus and permissions are synchronized into the Application Center.

Workspace convention:

- avoid extra `*-ui-warmup` services when possible
- run the warmup call inside the frontend container itself
- use a background shell process and then `exec node server.js`

This pattern is already used for:

- `utente`
- `theque`
- `igrp-process-management`
- `igrp-process-studio`

## Observability Model

The monitoring stack is based on OpenTelemetry plus Grafana tools.

Expected flow:

1. applications send telemetry to `demoteste-otel-collector`
2. collector forwards:
   - metrics to Prometheus
   - logs to Loki
   - traces to Tempo
3. Tempo generates derived metrics for spans and service graph
4. Grafana queries Prometheus, Loki and Tempo

Important notes:

- Grafana datasources are provisioned automatically
- Tempo service graph is enabled through Tempo plus Prometheus integration
- Spring applications control telemetry through `OTEL_DISABLED`

## Recommended Startup Order

Start the environment in this order:

1. root stack
2. project stacks as needed
3. process stack
4. monitoring stack

This matters because `process` and `monitoring` depend on the shared root infrastructure and Docker network.

## Commands

### Start root stack with Keycloak

```powershell
docker compose --env-file .env -f igrp-compose.yaml up -d
```

### Start root stack with Autentika

```powershell
docker compose --env-file .igrp-autentika.env -f igrp-autentika-compose.yaml up -d
```

### Start process stack with Keycloak

```powershell
cd process
docker compose --env-file ./.env_process -f .\igrp-process-compose.yaml up -d
```

### Start process stack with Autentika

```powershell
cd process
docker compose --env-file ./.env_process_autentika -f .\igrp-process-autentika-compose.yaml up -d
```

### Start monitoring stack

```powershell
cd monitoring
docker compose --env-file ./.env_monitoring -f .\igrp-monitoring-compose.yaml up -d
```

### Start a project stack

```powershell
cd projects/theque
docker compose --env-file ../../.env -f .\igrp-compose-theque.yaml up -d
```

### Stop root stack

```powershell
docker compose --env-file .env -f igrp-compose.yaml down
```

### Stop process stack

```powershell
cd process
docker compose --env-file ./.env_process -f .\igrp-process-compose.yaml down
```

### Stop monitoring stack

```powershell
cd monitoring
docker compose --env-file ./.env_monitoring -f .\igrp-monitoring-compose.yaml down
```

## Main Access URLs

When the environment is running, the main URLs are:

Note: if `HOST_NGINX_HTTP_PORT` is changed, replace `2575` in the URLs below with that value.

- Application Center: `http://localhost:2575/`
- Keycloak: `http://localhost:2575/auth/`
- API Gateway: `http://localhost:2575/gateway-api/`
- Eureka: `http://localhost:2575/eureka/`
- PgAdmin: `http://localhost:2575/pgadmin/`
- Grafana: `http://localhost:2575/grafana/`
- MinIO: `http://localhost:2575/minio/`

Examples of frontend URLs:

- `http://localhost:2575/apps/utente`
- `http://localhost:2575/apps/theque`
- `http://localhost:2575/apps/igrp-process-management`
- `http://localhost:2575/apps/igrp-process-studio`

## Template Rules To Reuse In Other Workspaces

If this workspace is used as a template, preserve these rules:

- keep one root stack for shared infrastructure
- keep optional stacks like `process` and `monitoring` separate
- keep application projects under `projects/`
- give each project its own workspace compose file
- publish frontends under `/apps/<project>`
- expose Spring APIs through the API Gateway
- use `Eureka` for Spring service discovery
- externalize high-priority operational values into env files
- keep authentication modes separated by compose/env pairs
- prefer healthchecks over extra `*-ready` helper containers
- prefer in-container frontend warmup over separate `*-ui-warmup` containers

## Final Note

This workspace is the operational model to follow for similar IGRP workspaces.

It shows how to structure:

- shared platform infrastructure
- project-level application stacks
- process extensions
- observability
- authentication modes
- readiness and warmup behavior

For a new team member, the safest mental model is:

- start the root stack first
- add only the project stacks you need
- use the process and monitoring stacks as extensions
- access everything through `Nginx`
- treat this repository as the template for future workspaces
