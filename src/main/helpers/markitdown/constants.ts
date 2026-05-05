export const MARKITDOWN_MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024

export const MARKITDOWN_SPAWN_TIMEOUT_MS = 2 * 60 * 1000

export const MARKITDOWN_SUPPORTED_EXTENSIONS = [
    'pdf',
    'docx',
    'pptx',
    'xlsx',
    'xls',
    'html',
    'htm',
    'csv',
    'json',
    'xml',
    'txt',
    'md',
    'png',
    'jpg',
    'jpeg',
    'mp3',
    'wav',
    'zip',
    'epub'
] as const

export type MarkItDownSupportedExtension = (typeof MARKITDOWN_SUPPORTED_EXTENSIONS)[number]

export function isSupportedExtension(ext: string): ext is MarkItDownSupportedExtension {
    return (MARKITDOWN_SUPPORTED_EXTENSIONS as readonly string[]).includes(ext.toLowerCase())
}
