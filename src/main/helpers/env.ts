import dotenv from 'dotenv'

/**
 * Load .env at module evaluation time so that any subsequent main-process
 * import (auth helpers, services) sees the parsed values via process.env.
 * Import this module BEFORE anything that reads env vars at module load
 * (e.g. the DEV_PORT capture in git-auth.ts).
 */
dotenv.config()
