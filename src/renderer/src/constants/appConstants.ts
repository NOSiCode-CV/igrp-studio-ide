export const LNG = {
    SUPPORTED_LANGUAGES: ['pt', 'en'],
    DEFAULT_LANGUAGE: 'en',
    NAMESSPACE: 'translation'
};

export enum ENV_TYPES {
    NEXTJS = "baseApp",
    SPRING = "baseApi"
};

export const PATTERNS = {
    NOT_EMPTY: /^.+$/,
    NO_SPACE_AND_HYPHEN: /^[^\s-]+$/,
    NAME_VALIDATION_PATTERN: /^[A-Za-z][A-Za-z0-9_]*$/,
    NAMESPACE_VALIDATION_PATTERN: /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+[0-9a-z_]$/,
    PARAMS_VALIDATION: /^[a-zA-Z0-9_]+$/,
    PATH_VALIDATION: /^[a-zA-Z_/]+$/,  
};

