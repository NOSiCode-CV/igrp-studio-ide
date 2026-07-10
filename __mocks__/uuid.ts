/**
 * CJS stand-in for the ESM-only `uuid` package (v13+ ships no CommonJS
 * build, and Jest's require(ESM) needs Node ≥24.9). Backed by node:crypto's
 * spec-compliant v4 generator, so consumers get real unique IDs.
 */
import { randomUUID } from 'crypto'

export const v4 = (): string => randomUUID()
