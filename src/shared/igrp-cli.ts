/**
 * Shared `@igrp/cli` install constants — single source of truth for onboarding,
 * notification update, and skill-discovery error copy.
 *
 * Runtime install always goes through `window.api.installIGRPCLI` →
 * `installIgrpCli()` in main (`igrp-cli-service.ts`). Do not spawn npm from
 * the renderer.
 */

export const IGRP_CLI_PACKAGE = '@igrp/cli'
export const IGRP_CLI_REGISTRY = 'https://sonatype.nosi.cv/repository/npm-group/'

/** Builds the same `npm install -g` command used by main-process install. */
export function buildIgrpCliInstallCommand(version?: string): string {
    const pkgSpec =
        version && /^\d+\.\d+\.\d+/.test(version)
            ? `${IGRP_CLI_PACKAGE}@${version}`
            : IGRP_CLI_PACKAGE
    return `npm install -g ${pkgSpec} --registry=${IGRP_CLI_REGISTRY}`
}
