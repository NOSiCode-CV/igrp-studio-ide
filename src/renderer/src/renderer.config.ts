/**
 * Renderer Configuration
 * Simple configuration for IGRP Studio ide renderer
 */

// Generated path configuration
export const GENERATED_PATH = '@/app/(igrp)/(generated)/';

// File system paths (for actual file operations)
export const FILE_SYSTEM_PATHS = {
    generated: 'src/app/(igrp)/(generated)',
    components: 'src/components',
    pages: 'src/app/(igrp)/(generated)',
    customComponents: 'src/components',
};

// Default configuration
export const RENDERER_CONFIG = {
    generatedPath: GENERATED_PATH,
    componentsPath: `${GENERATED_PATH}/components`,
    pagesPath: GENERATED_PATH,
    customComponentsPath: '@/components/',
    fileSystemPaths: FILE_SYSTEM_PATHS,
};

// Export default for easy access
export default RENDERER_CONFIG;
