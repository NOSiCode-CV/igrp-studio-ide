/**
 * Renderer wrapper around the shared IPC install used by onboarding and the
 * CLI-update notification. Keeps a single call site for `installIGRPCLI`.
 */
export { buildIgrpCliInstallCommand, IGRP_CLI_PACKAGE, IGRP_CLI_REGISTRY } from '@shared/igrp-cli'

export type IgrpCliInstallResult = {
    success: boolean
    output?: string
    error?: string
}

export async function installIgrpCli(version?: string): Promise<IgrpCliInstallResult> {
    if (!window.api?.installIGRPCLI) {
        return { success: false, error: 'IGRP CLI install API is not available.' }
    }
    return window.api.installIGRPCLI(version)
}
