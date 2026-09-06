import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const [, , targetPlatform = 'win32', targetArch = 'x64'] = process.argv

const targetPackages = {
    win32: {
        x64: [
            ['@lancedb/lancedb-win32-x64-msvc', '0.27.2'],
            ['@parcel/watcher-win32-x64', '2.5.6'],
            ['@tailwindcss/oxide-win32-x64-msvc', '4.3.0'],
            ['lightningcss-win32-x64-msvc', '1.32.0'],
            ['apache-arrow', '18.1.0']
        ]
    }
}

const packages = targetPackages[targetPlatform]?.[targetArch]

if (!packages) {
    throw new Error(`Unsupported target platform/architecture: ${targetPlatform}/${targetArch}`)
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const installArgs = [
    'install',
    '--no-save',
    '--no-package-lock',
    '--ignore-scripts',
    '--legacy-peer-deps',
    '--include=optional',
    `--os=${targetPlatform}`,
    `--cpu=${targetArch}`,
    ...packages.map(([name, version]) => `${name}@${version}`)
]

console.log(`Installing target-native dependencies for ${targetPlatform}/${targetArch}`)
console.log(`Packages: ${packages.map(([name, version]) => `${name}@${version}`).join(', ')}`)

const result = spawnSync(npmCommand, installArgs, {
    cwd: process.cwd(),
    stdio: 'inherit',
    // Windows exposes npm as a .cmd shim; POSIX can execute npm directly.
    shell: process.platform === 'win32'
})

if (result.error) {
    throw result.error
}

if (result.status !== 0) {
    process.exit(result.status ?? 1)
}

for (const [name, expectedVersion] of packages) {
    const packageJsonPath = path.join(
        process.cwd(),
        'node_modules',
        ...name.split('/'),
        'package.json'
    )

    if (!existsSync(packageJsonPath)) {
        throw new Error(`Target dependency was not installed: ${name}`)
    }

    const metadata = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
    if (metadata.version !== expectedVersion) {
        throw new Error(
            `Unexpected version for ${name}: expected ${expectedVersion}, got ${metadata.version}`
        )
    }
}

console.log('Target-native dependency preparation passed.')
