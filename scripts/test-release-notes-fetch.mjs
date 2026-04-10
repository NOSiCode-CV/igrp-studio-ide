#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

/**
 * Testa se as release notes para uma versão são obtidas do GitHub (tag v{versão}).
 * Token opcional: GITHUB_TOKEN ou VITE_GITHUB_TOKEN no .env (Personal Access Token; não usar CLIENT_SECRET).
 * Uso:
 *   node scripts/test-release-notes-fetch.mjs [versão]     → testa GitHub
 *   node scripts/test-release-notes-fetch.mjs [versão] --local  → mostra ficheiro local release-notes/{versão}.txt
 * Exemplo: node scripts/test-release-notes-fetch.mjs 0.2.0-beta.10.4
 */

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Load .env so VITE_GITHUB_TOKEN / GITHUB_TOKEN are available
try {
  const dotenv = await import('dotenv')
  dotenv.config({ path: join(ROOT, '.env') })
} catch {
  // dotenv not required
}

const args = process.argv.slice(2)
const useLocal = args.includes('--local')
const VERSION = args.filter((a) => a !== '--local')[0] || 'v0.2.0-beta.10.3'
const SANITIZED = VERSION.replace(/[^a-zA-Z0-9.-]/g, '')
const LOCAL_TXT = join(ROOT, 'release-notes', `${SANITIZED}.txt`)
const LOCAL_MD = join(ROOT, 'release-notes', `${SANITIZED}.md`)

const GITHUB_API = 'https://api.github.com/repos/NOSiCode-CV/igrp-studio-ide/releases'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN

async function fetchGitHub(tag) {
  const url = `${GITHUB_API}/tags/${encodeURIComponent(tag)}`
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'IGRP-Studio-Release-Notes-Test'
  }
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`
  const res = await fetch(url, { headers })
  if (!res.ok) return { ok: false, status: res.status, body: null }
  const data = await res.json()
  return { ok: true, status: res.status, body: data?.body?.trim() || null }
}

async function main() {
  if (useLocal) {
    console.log('Local release notes for version:', VERSION)
    console.log('')
    for (const [label, path] of [
      ['.txt', LOCAL_TXT],
      ['.md', LOCAL_MD]
    ]) {
      if (existsSync(path)) {
        const content = readFileSync(path, 'utf8').trim()
        console.log(`release-notes/${SANITIZED}${label}: ${content.length} chars`)
        console.log('---')
        console.log(content)
        console.log('---')
      } else {
        console.log(`release-notes/${SANITIZED}${label}: file not found`)
      }
      console.log('')
    }
    return
  }

  console.log('Testing release notes fetch for version:', VERSION)
  console.log('')

  const tag = SANITIZED.startsWith('v') ? SANITIZED : `v${SANITIZED}`
  const apiUrl = `${GITHUB_API}/tags/${encodeURIComponent(tag)}`
  console.log('GitHub Releases API (tag ' + tag + ')')
  console.log('   URL: ' + apiUrl)
  if (GITHUB_TOKEN) console.log('   (using GITHUB_TOKEN for auth)')
  try {
    const result = await fetchGitHub(tag)
    console.log('   ' + (result.ok ? 'OK' : 'NOT FOUND') + ' (HTTP ' + result.status + ')')
    if (result.body) {
      console.log('   Body length:', result.body.length, 'chars')
      console.log('   Preview:', result.body.slice(0, 120) + '...')
    } else if (result.ok) {
      console.log('   (Release exists but body is empty)')
    }
  } catch (err) {
    console.log('   ERROR', err.message)
  }

  console.log('')
  console.log('Done. Release notes come only from GitHub (tag v{version}).')
  console.log('If 404: repo may be private. Add VITE_GITHUB_TOKEN (ou GITHUB_TOKEN) ao .env com um Personal Access Token.')
  console.log('Local file check: node scripts/test-release-notes-fetch.mjs ' + VERSION + ' --local')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
