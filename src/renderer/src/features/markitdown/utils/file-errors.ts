type ErrorCode = 'unsupported' | 'too-large' | 'not-found' | 'timeout' | 'spawn' | 'runtime'

export function humanizeMarkItDownError(code: ErrorCode | undefined, fallback: string): string {
    switch (code) {
        case 'unsupported':
            return 'This file type is not supported. Try PDF, DOCX, PPTX, XLSX, HTML, CSV, JSON, XML, TXT, MD, PNG, JPG, MP3, WAV, ZIP or EPUB.'
        case 'too-large':
            return 'The file is too large. Maximum allowed is 100 MB.'
        case 'not-found':
            return 'The file could not be found. It may have been moved or deleted.'
        case 'timeout':
            return 'Conversion took too long and was cancelled after 2 minutes.'
        case 'spawn':
            return 'Could not start the MarkItDown runtime. Check your Python installation or doctor report.'
        case 'runtime':
            return fallback || 'MarkItDown failed while converting this file.'
        default:
            return fallback || 'Conversion failed.'
    }
}
