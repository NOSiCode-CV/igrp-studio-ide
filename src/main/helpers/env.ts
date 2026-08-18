import dotenv from 'dotenv'

/**
 * Load .env at module evaluation time so that any subsequent main-process
 * import (auth helpers, services) sees the parsed values via process.env.
 * Import this module BEFORE anything that reads env vars at module load.
 */
dotenv.config()
