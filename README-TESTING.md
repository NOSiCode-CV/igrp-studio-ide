# Testing guide — packaged candidates

This guide is for a tester who receives a packaged IGRP Studio Horizon candidate and does not build the application from source.

The tester must have access to `git.nosi.cv`. Download candidates from the GitLab job artifacts, not from an unverified copy sent by email or chat.

> **Current acceptance warning (2026-09-04):** the Windows job `108769` is
> marked **Passed** by GitLab, but the exact candidate is **not accepted**.
> Its extracted payload contains Linux-only native variants for required
> packages (`@lancedb/lancedb`, `@parcel/watcher`, `@tailwindcss/oxide` and
> `lightningcss`); direct Windows probes failed. Do not present this `.exe` as
> a working Windows release. Use it only to reproduce the recorded finding, or
> wait for a new candidate produced after the packaging correction.

### Pipeline correction prepared (not yet CI-validated)

The working tree now contains a Windows packaging gate that installs the
Windows x64 native packages explicitly, adds the required `apache-arrow` peer,
uses `electron-builder.yml`, disables the builder's native rebuild, and checks
the unpacked payload before release. The Windows build does not publish by
itself; the `release` job receives the artifact only after the build job passes.
The CI jobs now resolve `@igrp/django-engine` and `@igrp/dotnet-engine` from
the authenticated NOSi registry instead of `file:../../...` sibling paths,
write the registry configuration before installation, and use an explicit
`electron-builder.yml` with `--publish never` for candidate builds. This is
source-level preparation only. A new tag pipeline must still run and produce
a new artifact before the Windows row above can change to accepted.

### Current source verification (2026-09-06)

The canonical checkout contains the enum/type-payload hardening and the CI
packaging correction, but these changes are not yet represented by a new
GitLab candidate:

| Check | Result |
|---|---|
| Focused model/DTO normalization tests | **PASS** — 2 suites, 5 tests |
| Full Horizon Jest suite | **PASS** — 23 suites, 153 tests |
| Typecheck | **PASS** — Node and web projects |
| Renderer production build | **PASS** — `electron-vite build` |
| Target Windows native payload preparation | **PASS** — required x64 packages and `apache-arrow` present |
| Unpacked Windows payload verification | **PASS** — `dist/win-unpacked` |
| Cross-module generator fixture | **PASS** — `people` + `sales` + `shared`, four relation types, DTO inheritance, enums and controllers |
| Generated cross-module .NET build | **PASS** — 0 warnings/0 errors |
| Generated cross-module tests | **PASS** — 7/7 |
| Generated DDD cross-module build/tests | **PASS** — 0 warnings/0 errors, 5/5 |
| EF migration and PostgreSQL schema | **PASS** — migration applied; domain tables, foreign keys and `customer_tag` join table present |
| Cross-module REST/GraphQL runtime verifier | **PASS** — health/OpenAPI, CRUD, relation persistence, validation and cleanup |
| Generated custom controller business logic | **NOT IMPLEMENTED** — generated scaffold routes correctly return `501` until a developer supplies the handler |
| Local NSIS installer creation | **BLOCKED** — Windows `winCodeSign` extraction needs symlink privilege; local signing certificate is not available |
| New GitLab Windows artifact | **NOT VERIFIED** — requires push/tag pipeline |
| macOS artifact | **BLOCKED** — no macOS runner is enabled |
| PostgreSQL runtime E2E | **PASS (isolated follow-up)** — generated API passed REST + GraphQL CRUD after explicit EF schema preparation |
| Docker-specific runtime path | **BLOCKED** — Docker Desktop/service is unavailable to the current account |

The exact command outputs and decision record are kept in
`C:\Users\ipp21\NosiEngine\evidence\horizon-windows-installed-artifact-full-e2e-20260904\CORRECTION_SOURCE_VERIFICATION_20260905.md`.
These source checks do not replace testing the new downloaded installer.

### Follow-up runtime E2E (2026-09-05)

The disposable Docker path was unavailable, so the generated acceptance
project was run against an isolated PostgreSQL cluster on the local machine.
After an explicit EF migration was created for the copied fixture, the
database health check returned 200 and the Department, Employee and Project
resources passed REST create/list/update/get/delete/delete-confirmation flows.
GraphQL introspection and CRUD mutations also passed. The Swagger UI was used
manually for Department create/list/get/delete. The complete sanitized record
is in:

`C:\Users\ipp21\NosiEngine\evidence\horizon-full-e2e-stress-20260905-132559\E2E_RESULTS.md`

This proves the generated API/runtime contract with schema preparation. It does
not silently convert the old Windows installer into an accepted candidate, and
it does not prove that a fresh Horizon project creates a database schema without
the documented migration/CLI preparation step.

### Cross-module integration fixture (2026-09-06)

The repository now contains a deterministic fixture and public-surface verifier:

```text
scripts/stress-cross-module.mjs
scripts/verify-cross-module-runtime.mjs
```

The fixture creates two real domain modules (`people` and `sales`) plus the
reserved `Shared` bucket. It covers:

- `Profile -> Customer` OneToOne;
- `Customer -> Order` cross-module OneToMany/ManyToOne;
- `Order -> OrderItem` OneToMany/ManyToOne;
- `Customer <-> Tag` ManyToMany with `customer_tag`;
- a `sales` DTO inheriting from a `Shared` DTO;
- a `Shared` enum used by a `sales` model;
- CRUD controllers and custom controllers owned by `people`/`sales`.

`Shared` is not an endpoint module. Create a domain module before creating an
endpoint in the Horizon UI.

To reproduce the acceptance flow in PowerShell:

```powershell
node scripts/stress-cross-module.mjs technical Postgresql C:/tmp/horizon-cross-module-acceptance
Set-Location C:/tmp/horizon-cross-module-acceptance
dotnet tool restore
dotnet ef migrations add CrossModuleInitialCreate --project .\cross-module-acceptance-api.csproj --output-dir src\Data\Migrations
dotnet ef database update --project .\cross-module-acceptance-api.csproj
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:DOTNET_ENVIRONMENT = 'Development'
$env:ConnectionStrings__DefaultConnection = 'Host=127.0.0.1;Port=55433;Database=cross_module_acceptance;Username=postgres;Password=<local-test-password>'
$env:ASPNETCORE_URLS = 'http://127.0.0.1:8185'
dotnet run --project .\cross-module-acceptance-api.csproj --no-launch-profile --no-build
```

In another terminal, run:

```powershell
Set-Location C:\Users\ipp21\NosiEngine\IgrpStudio\igrp-studio-horizon
node scripts/verify-cross-module-runtime.mjs http://127.0.0.1:8185
```

The verifier expects generated custom controller routes to return `501`:
the engine can generate their route and response contract, but it cannot invent
the application's business logic. CRUD REST and GraphQL operations must return
their normal success/error statuses and finish with `CROSS_MODULE_RUNTIME_PASS`.

## What is currently proven

| Component | CI evidence | Candidate / limitation | Manual acceptance |
|---|---|---|---|
| Horizon — Linux x64 | Pipeline **40620**, job **108539**, Passed | `IGRP-Studio-0.2.0-beta.20-x86_64.AppImage` (321 MiB) or `IGRP-Studio-0.2.0-beta.20-amd64.deb` (228 MiB) | Not yet verified by an external tester |
| Horizon — Windows | Job **108769**, Passed | `igrp-studio-0.2.0-beta.20-setup.exe` (273 MiB); exact payload has a confirmed native dependency defect and pipeline **40762** also contains manual actions | **Blocked / not accepted** until a corrected candidate is produced and tested |
| Horizon — macOS | No passed macOS candidate | Job is blocked because no macOS runner is available | **Blocked / not verified** |
| .NET engine package | Pipeline **40739**, job **108722**, Passed | `igrp-dotnet-engine-0.1.0-rc.10.tgz` (932 KiB) | Requires a package-level test in a sample project |

CI Passed means that the recorded CI job completed successfully and produced an artifact. It does not, by itself, prove that a person installed and used the application successfully.

### Internal Windows evidence record

This is an internal isolated test record, not an external acceptance claim.

```text
Tester: Codex background isolated UI run
Environment: Windows x64 build 10.0.26200, separate app copy/profile/workspace
Date: 2026-09-04 to 2026-09-05
Artifact: igrp-studio-0.2.0-beta.20-setup.exe
Pipeline/job: 40762 / 108769
Commit: ac68f2de235654b2c9927d1f98a63921632c95c6
SHA-256: CEEF2B5CE9C308CA6B8CB1B8A660C0E286E2494878565DEF256867760AD9DA22
Final checks: restore PASS; build PASS (0 warnings/0 errors); test PASS (3/3)
Runtime/database/enum/endpoint status: BLOCKED or NOT VERIFIED
Overall candidate status: HOLD — not accepted
```

The final check logs are retained with the evidence package:
`dotnet-restore-final-20260905.txt`, `dotnet-build-final-20260905.txt`,
`dotnet-test-final-20260905.txt`, `dotnet-ef-migrations-final-20260905.txt`
and `generated-host-probe-final-20260905.txt`.

## Internal background UI check (2026-09-04 to 2026-09-05)

An isolated run against the installed Windows candidate (`40762` / job
`108769`) exercised the public UI without overlapping the user's normal Horizon
profile or workspace. It created and reopened three schemas (`Department`,
`Employee` and `Project`), exercised OneToOne, OneToMany, ManyToOne and
ManyToMany relation editor modes, generated rich fields and a unique UUID,
enabled CRUD, toggled revision OFF/ON/OFF, and verified persisted state after
reopen. The final Department relation persisted as ManyToMany to `Employee.id`
with join table `department_employee`. The generated solution passed restore,
build (0 warnings/0 errors) and 3/3 smoke tests.

This remains supporting evidence for the historical candidate's UI
configuration and source generation. In that run Docker bootstrap was kept
off, the endpoint module selector had no selectable item, and enum save was
rejected by the old generator payload. The empty endpoint selector was
observed in a project containing only the `Shared` bucket; the UI intentionally
excludes `Shared` from the endpoint module list. This is not evidence that an
endpoint can exist without a module: create a domain module first and repeat
the endpoint step. A separate follow-up then proved the generated API runtime
with an isolated PostgreSQL database and explicit schema preparation; see
`E2E_RESULTS.md`. The Windows native-payload defect remains release-blocking.
Keep these historical UI, runtime, and installer states separate.

## 1. Download the candidate

Use the matching job while logged in:

- [Horizon Linux job 108539](https://git.nosi.cv/igrp-3_0/igrp-studio/igrp-studio-horizon/-/jobs/108539)
- [Horizon Linux artifacts](https://git.nosi.cv/igrp-3_0/igrp-studio/igrp-studio-horizon/-/jobs/108539/artifacts/browse/dist/)
- [Horizon Windows candidate job 108769](https://git.nosi.cv/igrp-3_0/igrp-studio/igrp-studio-horizon/-/jobs/108769)
- [Horizon Windows artifacts](https://git.nosi.cv/igrp-3_0/igrp-studio/igrp-studio-horizon/-/jobs/108769/artifacts/browse/dist/)
- [Dotnet engine job 108722](https://git.nosi.cv/igrp-3_0/igrp-studio/dotnet-engine/-/jobs/108722)
- [Dotnet engine artifacts](https://git.nosi.cv/igrp-3_0/igrp-studio/dotnet-engine/-/jobs/108722/artifacts/browse/package-artifact/)

On the job page:

1. Confirm the job status is **Passed**.
2. Open **Artifacts** or **Download artifacts archive**.
3. Extract the archive and select the file for the tester's operating system.
4. Do not use a Linux `.deb`/`.AppImage` on Windows or a Windows `.exe` on macOS.

## 2. Verify the downloaded file

Record the exact filename and calculate its SHA-256 hash before running it.

Windows PowerShell:

```powershell
Get-FileHash .\igrp-studio-0.2.0-beta.20-setup.exe -Algorithm SHA256
```

Linux:

```bash
sha256sum ./IGRP-Studio-0.2.0-beta.20-x86_64.AppImage
```

macOS/Linux alternative:

```bash
shasum -a 256 ./file-name
```

If the filename, version, source job, or hash is unexpected, stop and record **BLOCKED**. Do not test an untraceable binary.

## 3. Install and launch

### Linux x64

Portable AppImage:

```bash
chmod +x ./IGRP-Studio-0.2.0-beta.20-x86_64.AppImage
./IGRP-Studio-0.2.0-beta.20-x86_64.AppImage
```

Debian/Ubuntu package:

```bash
sudo apt install ./IGRP-Studio-0.2.0-beta.20-amd64.deb
```

Launch the application and confirm that the main window opens without an immediate crash.

### Windows x64

1. Download the Windows setup artifact from job **108769**.
2. Confirm that the job is **Passed** and that the artifact is the expected `.exe` candidate.
3. Calculate the SHA-256 hash.
4. For the current `beta.20` candidate, stop after recording the hash unless
   the purpose is explicitly to reproduce the packaging defect. A corrected
   candidate must be available before claiming Windows acceptance.
5. Run the corrected installer and launch IGRP Studio Horizon from the Start menu.
6. If SmartScreen appears, verify the source, filename, and hash first; follow the organization's software policy and do not blindly bypass security warnings.

### macOS

There is currently no passed macOS artifact to test. Do not report macOS acceptance until a macOS runner produces a passed job and a `.dmg` or equivalent artifact is available.

## 4. Application smoke test

For every platform with a usable candidate:

1. Launch the application.
2. Create or open a test workspace.
3. Create a test project.
4. Create a representative entity/model, including at least one field and the relevant key or relationship.
5. Save the project, close or change workspace, and reopen it.
6. Generate the selected backend or application output.
7. Inspect the generated files for the expected project structure and configuration.
8. Build the generated project using its documented command.
9. If the generated project contains Docker Compose services, run `docker compose up -d` and confirm the services become healthy.
10. Exercise at least one representative REST endpoint and one GraphQL operation when those features are part of the project.
11. Confirm that the application remains usable after the generation/build flow and that no data is lost after reopening.

Expected result: the candidate installs or launches, the representative workflow completes, generated output is buildable, and the tested endpoints return the expected result.

## 4.1 Full model/relation UI test

Use a disposable workspace and project. Record a screenshot or screen
recording at each checkpoint and keep the exact candidate/job beside the test
record.

1. Create `Department` with `departmentName` and `description`; save it.
2. Create `Employee` with `employeeName` and `emailAddress`; save it.
3. Create `Project` with text, date, decimal, boolean and UUID fields; mark the
   UUID unique; save it.
4. Enable CRUD for all three models and confirm the generated controllers/DTOs
   appear.
5. On a disposable relation field, configure and save each supported mode in
   turn: OneToOne, OneToMany, ManyToOne and ManyToMany. For the final mode,
   reopen the model and record the target column and join-table metadata.
6. Toggle revision OFF→ON→OFF, save after each transition, close the app and
   reopen the workspace. Confirm the final OFF state and all three models are
   still present.
7. Open the enum editor. On a corrected candidate, create an enum and use it
   as a model field. The corrected source normalizes the selector payload to
   `type` + `objectType: "enum"` + `module`; record the generated manifest and
   the save result. If the candidate still rejects the field, record the exact
   validation/error and mark the enum gate `BLOCKED` or `FAIL`; do not silently
   leave the project in a broken state. The old job `108769` remains blocked.
8. Create a domain module first (for example `HumanResources`; `Shared` is not
   offered as an endpoint module), then open the endpoint action editor and
   select that module. If the selector is still empty after a domain module
   exists, record the exact state as `BLOCKED/NOT VERIFIED`; do not report an
   endpoint as created.
9. Run `dotnet restore`, `dotnet build` and `dotnet test` on the generated
   solution.
10. Prepare the schema before calling REST or GraphQL. If the generated
    project has no migration under `src/Data/Migrations`, use the project's
    restored `dotnet-ef` tool to create one in the disposable test project:

    ```powershell
    dotnet tool restore
    dotnet ef migrations add InitialCreate --project .\<project>.csproj --output-dir src\Data\Migrations
    dotnet build .\<project>.csproj --nologo
    dotnet ef database update --project .\<project>.csproj
    ```

    Alternatively use the installed iGRP CLI's backend-run command when it is
    available; that command owns build, migration and runtime preparation.
11. Start the generated host with the disposable database configuration, then
    run `scripts/verify-cross-module-runtime.mjs` where the fixture applies.
    Do not put real passwords or tokens into the report, screenshots, repository
    README, or CI logs.
12. If Docker is available, the preferred environment is the generated
    Compose PostgreSQL service. If Docker is unavailable, mark the Docker gate
    **BLOCKED** and use an isolated local PostgreSQL instance only for a
    separately labelled runtime check.

The four relation editor screenshots demonstrate configuration only. A real
database, migration, REST or GraphQL PASS requires the generated application to
start against PostgreSQL and a test record containing the actual request and
response. The migration/schema preparation must be recorded explicitly; a
healthy database connection alone does not mean that application tables exist.

## 5. Optional .NET engine package check

For `igrp-dotnet-engine-0.1.0-rc.10.tgz`, create an isolated sample project and install the downloaded package locally:

```bash
mkdir dotnet-engine-candidate-test
cd dotnet-engine-candidate-test
npm init -y
npm install /path/to/igrp-dotnet-engine-0.1.0-rc.10.tgz
```

Then run the representative generator or engine command documented by the consuming project and record the generated output and build result. Use the same process for any `.nupkg` package, with a local NuGet source if required.

## 6. Test record to return

Copy this template for each tested platform:

```text
Tester:
Date/time:
Operating system and version:
Architecture:
Artifact filename:
Pipeline/job:
Commit:
SHA-256:

Steps executed:
Expected result:
Actual result:
Status: PASS / FAIL / BLOCKED / NOT VERIFIED

Notes, error messages, and screenshots:
```

Use **PASS** only after the manual smoke test actually succeeds. Use **BLOCKED** for missing access, missing artifact, unavailable runner, or an environment prerequisite that prevents testing.

## 7. What to write in the internship report now

At this stage, the report may state that the referenced CI jobs passed and that the
GitLab job/artifact association was observed. Do not claim that a complete
visual evidence set exists unless the sanitized screenshots are actually stored
with the report. Do not state that Windows/macOS or the complete end-to-end
product workflow was accepted unless a tester has completed the manual record
above.

Suggested wording:

> Foram verificadas no GitLab as execuções de CI e os artefactos associados. No `dotnet-engine`, a pipeline 40739 e o job 108722 terminaram com sucesso e produziram `igrp-dotnet-engine-0.1.0-rc.10.tgz`. No `igrp-studio-horizon`, a pipeline 40620 e o job 108539 terminaram com sucesso e produziram os artefactos Linux `.deb` e AppImage. O job Windows 108769 também terminou com sucesso, mas a inspecção do payload exacto encontrou dependências nativas Linux-only; por isso, o candidato Windows permanece bloqueado e não deve ser descrito como aceito. A execução manual em cada sistema operativo deve ser registada separadamente. O macOS permanece bloqueado por falta de runner macOS.

After a real manual test, add the tester's operating system, date, exact artifact, pipeline/job, commit, SHA-256, expected result, actual result, and PASS/FAIL/BLOCKED status. Keep **CI Passed** and **Manual smoke test Passed** as separate fields.

## 8. How to update repository documentation

After manual testing:

1. Update the platform/support table in `README.md` with the tested version and platform.
2. Link to the GitLab pipeline/job rather than committing large binaries to the repository.
3. Add the artifact filename, commit, hash, test date, tester, and manual result to the release/testing notes.
4. Keep known limitations visible: Linux evidence is not Windows/macOS evidence, the overall Windows candidate pipeline may still be Blocked by manual actions, and macOS needs a runner.
5. Make documentation-only changes in a separate reviewable commit or merge request.
6. Never add tokens, passwords, registry credentials, or raw credential-bearing CI output to the README or report.
