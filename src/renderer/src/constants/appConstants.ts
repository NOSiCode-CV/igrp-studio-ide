export const LNG = {
    SUPPORTED_LANGUAGES: ['pt', 'en'],
    DEFAULT_LANGUAGE: 'en',
    NAMESSPACE: 'translation',
};

export const PATTERNS = {
    NOT_EMPTY: /^.+$/,
    NO_SPACE_AND_HYPHEN: /^[^\s-]+$/,
    NAME_VALIDATION_PATTERN: /^[A-Za-z][A-Za-z0-9_]*$/,
    NAMESPACE_VALIDATION_PATTERN: /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+[0-9a-z_]$/,
    PARAMS_VALIDATION: /^[a-zA-Z0-9_]+$/,
    PATH_VALIDATION: /^[a-zA-Z_/]+$/,
    SPECIAL_CHARACTERS: /^[a-zA-Z0-9\s]*$/,
    SPECIAL_CHARACTERS_PROJECT_NAME: /^[a-zA-ZÀ-ÿ0-9\s]+$/,
    NO_SPACE_BUT_ALLOW_HYPHEN: /^[^\s]+$/,
    NAME_APP_VALIDATION: /^[a-zA-Z_-]+$/,
    // Next.js route segment validation (improved readability)
    VALID_SEGMENT_PATTERN: (() => {
        const segmentPatterns = [
            String.raw`\([^)]+\)`, // Route groups (auth)
            String.raw`\[(?:\.\.\.)?[\w-]+(?:\|\^[^\]]+\$)?\]`, // Dynamic [id] or [...slug]
            String.raw`\[\[(?:\.\.\.)?[\w-]+(?:\|\^[^\]]+\$)?\]\]`, // Optional [[...slug]]
            String.raw`[\w-]+`, // Static segments
        ].join('|');

        return new RegExp(
            `^(?:${segmentPatterns})(?:\\/(?:${segmentPatterns}))*?$`
        );
    })(),
};

export const OPTION_TYPE = {
    MODELS: 'models',
    MODEL: 'model',
    CONTROLLERS: 'controllers',
    CONTROLLER: 'controller',
    DATA_OBJECTS: 'dto',
    ACTION: 'action',
    MODAL: 'modal',
    RESPONSES: 'responses',
    RESPONSE: 'response',
    ENUM: 'enum',
    DELETE: 'delete',
    DUPLICATE: 'duplicate',
    ERDDiagram: 'ERDDiagram',
    FILE_THREE: 'filethree',
    PERMISSIONS: 'permissions',
} as const;

export type OptionType = (typeof OPTION_TYPE)[keyof typeof OPTION_TYPE];

// Framework icons are now handled by the FrameworkIcon component
// This export is kept for backward compatibility
export const projectIcons = {
    nextjs: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg',
    springboot:
        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg',
    dotnet: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dotnetcore/dotnetcore-original.svg',
    vuejs: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg',
    angular:
        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg',
    laravel:
        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-plain.svg',
    django: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg',
    go: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg',
};

export const PAGE_DEFAULT = 'Overview';

export const httpStatusCodes = [
    { value: '100', label: '100 Continue' },
    { value: '200', label: '200 OK' },
    { value: '201', label: '201 Created' },
    { value: '204', label: '204 No Content' },
    { value: '301', label: '301 Moved Permanently' },
    { value: '302', label: '302 Found' },
    { value: '304', label: '304 Not Modified' },
    { value: '400', label: '400 Bad Request' },
    { value: '401', label: '401 Unauthorized' },
    { value: '403', label: '403 Forbidden' },
    { value: '404', label: '404 Not Found' },
    { value: '500', label: '500 Internal Server Error' },
    { value: '502', label: '502 Bad Gateway' },
    { value: '503', label: '503 Service Unavailable' },
];

export const httpMethods = [
    { value: 'GET', label: 'GET', color: 'text-blue-500' },
    { value: 'POST', label: 'POST', color: 'text-green-500' },
    { value: 'PUT', label: 'PUT', color: 'text-yellow-500' },
    { value: 'PATCH', label: 'PATCH', color: 'text-orange-500' },
    { value: 'DELETE', label: 'DELETE', color: 'text-red-500' },
    { value: 'HEAD', label: 'HEAD', color: 'text-purple-500' },
    { value: 'OPTIONS', label: 'OPTIONS', color: 'text-indigo-500' },
    { value: 'TRACE', label: 'TRACE', color: 'text-pink-500' },
];

export enum ENV_TYPES {
    NEXTJS = 'nextjs',
    SPRING = 'springboot',
    DOTNET = 'dotnet',
}

export const DatabaseOptions = [
    { value: 'MySQL', label: 'MySQL' },
    { value: 'Oracle', label: 'Oracle' },
    { value: 'Postgresql', label: 'PostgreSQL' },
];

export const projectStructureStyle = [
    { value: 'technical', label: 'Technical' },
    { value: 'domain', label: 'Domain-Driven Design (DDD)' },
];

export enum APRESENTATION {
    DESIGN = 'design',
    CODE = 'code',
    JSON = 'json',
}
