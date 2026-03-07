import { exec } from 'child_process'
import type { ToolCheck } from '../../types'
import { toolConfig } from './doctor-config'

export function checkCommand(command: string): Promise<{ version?: string; error?: string }> {
    return new Promise((resolve) => {
        exec(`${command} --version`, (error, stdout, stderr) => {
            if (error) {
                resolve({ error: stderr || error.message })
            } else {
                resolve({ version: stdout.trim() })
            }
        })
    })
}

export function parseVersion(output: string): string {
    const match = output.match(/(\d+\.\d+\.\d+)/)
    return match ? match[1] : output.trim()
}

export function isVersionValid(version: string, min: number, max: number): boolean {
    const major = parseInt(version.split('.')[0], 10)
    return major >= min && major <= max
}

export async function runDockerInfoCheck(): Promise<{
    success: boolean
    error?: string
}> {
    return new Promise((resolve) => {
        exec('docker info', (error) => {
            if (error) {
                resolve({ success: false, error: error.message })
            } else {
                resolve({ success: true })
            }
        })
    })
}

export async function runDoctorChecks(): Promise<ToolCheck[]> {
    const results: ToolCheck[] = []

    for (const tool of toolConfig) {
        try {
            const { version, error } = await checkCommand(tool.command)

            let success = false
            let finalVersion = version
            let finalError = error

            if (version) {
                const parsedVersion = parseVersion(version)
                finalVersion = parsedVersion

                if (tool.versionCheck) {
                    success = isVersionValid(
                        parsedVersion,
                        tool.versionCheck.minMajor,
                        tool.versionCheck.maxMajor
                    )
                    if (!success) {
                        const rangeDisplay =
                            tool.versionCheck.range ||
                            `${tool.versionCheck.minMajor}.x - ${tool.versionCheck.maxMajor}.x`
                        finalError = `Unsupported version: ${parsedVersion}. Required: ${rangeDisplay}`
                    }
                } else {
                    success = true
                }

                // Additional checks
                if (success && tool.extraCheck === 'dockerDaemon') {
                    const dockerCheck = await runDockerInfoCheck()
                    if (!dockerCheck.success) {
                        success = false
                        finalError = `Docker daemon is not running: ${dockerCheck.error}`
                    }
                }
            } else {
                success = false
                finalError = error || `Command '${tool.command}' not found`
            }

            results.push({
                name: tool.name,
                command: tool.command,
                success,
                version: finalVersion,
                error: finalError,
                link: tool.link,
                category: tool.category,
                description: tool.description,
                required: tool.required
            })
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error'

            results.push({
                name: tool.name,
                command: tool.command,
                success: false,
                error: errorMessage,
                link: tool.link,
                category: tool.category,
                description: tool.description,
                required: tool.required
            })
        }
    }

    return results
}
