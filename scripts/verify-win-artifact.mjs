import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const appRoot = path.resolve(
    process.argv[2] ?? path.join('dist', 'win-unpacked', 'resources', 'app')
)

const requiredPackages = [
    ['@lancedb/lancedb', null, false],
    ['@lancedb/lancedb-win32-x64-msvc', '0.27.2', true],
    ['@parcel/watcher', null, false],
    ['@parcel/watcher-win32-x64', '2.5.6', true],
    ['@tailwindcss/oxide', null, false],
    ['@tailwindcss/oxide-win32-x64-msvc', '4.3.0', true],
    ['lightningcss', '1.32.0', false],
    ['lightningcss-win32-x64-msvc', '1.32.0', true],
    ['apache-arrow', '18.1.0', false]
]

function packageRoot(name) {
    return path.join(appRoot, 'node_modules', ...name.split('/'))
}

function packageMetadata(name) {
    const metadataPath = path.join(packageRoot(name), 'package.json')
    if (!existsSync(metadataPath)) {
        throw new Error(`Missing packaged dependency: ${name}`)
    }

    return JSON.parse(readFileSync(metadataPath, 'utf8'))
}

function containsNativeBinary(directory) {
    const entries = readdirSync(directory, { withFileTypes: true })

    for (const entry of entries) {
        const entryPath = path.join(directory, entry.name)
        if (entry.isDirectory()) {
            if (containsNativeBinary(entryPath)) return true
            continue
        }

        if (/\.(node|dll|exe)$/i.test(entry.name)) return true
    }

    return false
}

if (!existsSync(appRoot)) {
    throw new Error(`Windows unpacked application directory does not exist: ${appRoot}`)
}

for (const sensitiveFile of ['certificate.pfx', '.npmrc']) {
    if (existsSync(path.join(appRoot, sensitiveFile))) {
        throw new Error(`Sensitive packaging input leaked into the application: ${sensitiveFile}`)
    }
}

for (const [name, expectedVersion, native] of requiredPackages) {
    const metadata = packageMetadata(name)

    if (expectedVersion && metadata.version !== expectedVersion) {
        throw new Error(
            `Unexpected packaged version for ${name}: expected ${expectedVersion}, got ${metadata.version}`
        )
    }

    if (native && !containsNativeBinary(packageRoot(name))) {
        throw new Error(`No Windows native binary found in packaged dependency: ${name}`)
    }
}

console.log(`Windows artifact native dependency verification passed: ${appRoot}`)
