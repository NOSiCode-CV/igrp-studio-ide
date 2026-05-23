import {
    MARKITDOWN_SUPPORTED_EXTENSIONS,
    isSupportedExtension
} from '../src/main/helpers/markitdown/constants'

describe('markitdown/constants', () => {
    describe('isSupportedExtension', () => {
        it('accepts every extension listed in the canonical set', () => {
            for (const ext of MARKITDOWN_SUPPORTED_EXTENSIONS) {
                expect(isSupportedExtension(ext)).toBe(true)
            }
        })

        it('is case-insensitive', () => {
            expect(isSupportedExtension('PDF')).toBe(true)
            expect(isSupportedExtension('DoCx')).toBe(true)
        })

        it('rejects unsupported extensions', () => {
            expect(isSupportedExtension('exe')).toBe(false)
            expect(isSupportedExtension('rar')).toBe(false)
            expect(isSupportedExtension('')).toBe(false)
        })
    })
})
