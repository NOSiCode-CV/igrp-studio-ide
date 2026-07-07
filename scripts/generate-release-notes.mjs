#!/usr/bin/env node
/**
 * Gera RELEASE_NOTES.md para a versão do package.json.
 *
 * O ficheiro é embutido pelo electron-builder no channel yml do feed S3
 * (build.releaseInfo.releaseNotesFile), por isso as notas chegam ao end user
 * dentro do próprio feed de updates — sem chamadas a APIs externas nem tokens.
 *
 * Ordem de preferência para o conteúdo:
 *   1. release-notes/{versão}.md — notas curadas à mão (opcional)
 *   2. git log (sem merges) entre a tag anterior e a tag v{versão} ou HEAD
 *
 * Uso: node scripts/generate-release-notes.mjs
 */
import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'RELEASE_NOTES.md')

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
const version = pkg.version
const tag = `v${version}`

function tryGit(cmd) {
    try {
        return execSync(`git ${cmd}`, { cwd: ROOT, encoding: 'utf-8' }).trim()
    } catch {
        return ''
    }
}

let notes = ''
const curated = join(ROOT, 'release-notes', `${version}.md`)

if (existsSync(curated)) {
    notes = readFileSync(curated, 'utf-8').trim()
    console.log(`Release notes: a usar ficheiro curado release-notes/${version}.md`)
} else {
    // A tag da versão pode ainda não existir (gera-se antes do tagging) — usa HEAD.
    const head = tryGit(`rev-parse -q --verify refs/tags/${tag}`) ? tag : 'HEAD'
    const prev = tryGit(`describe --tags --abbrev=0 "${head}^"`)
    const range = prev ? `${prev}..${head}` : head
    const log = tryGit(`log --no-merges --pretty=format:"- %s" ${range}`)

    if (!log) {
        console.error(`Release notes: sem commits no intervalo ${range} — RELEASE_NOTES.md não atualizado`)
        process.exit(existsSync(OUT) ? 0 : 1)
    }

    // Remove ruído de release do changelog visível ao utilizador.
    const lines = log
        .split('\n')
        .filter((l) => !/^- (chore\(release\)|chore: bump|Merge )/i.test(l))
    notes = `## ${version}\n\n${lines.join('\n')}`
    console.log(`Release notes: geradas de git log ${range} (${lines.length} entradas)`)
}

writeFileSync(OUT, `${notes}\n`)
console.log(`Escrito ${OUT}`)
