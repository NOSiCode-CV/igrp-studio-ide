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


export enum OPTION_TYPE {
    MODELS = "models",
    CONTROLLERS = "controllers",
    DATA_OBJECTS = "dto",
    ACTION = 'action',
};

export type OptionType = 'models' | 'controllers' | 'dto' | 'action' | 'none';

export const projectIcons = {
    [ENV_TYPES.NEXTJS]: 'https://www.svgrepo.com/show/354113/nextjs-icon.svg',
    [ENV_TYPES.SPRING]: 'https://www.svgrepo.com/show/354380/spring-icon.svg'
}

export const PAGE_DEFAULT = 'Overview'

export const httpStatusCodes = [
    { value: "100", label: "100 Continue", },
    { value: "200", label: "200 OK" },
    { value: "201", label: "201 Created" },
    { value: "204", label: "204 No Content" },
    { value: "301", label: "301 Moved Permanently" },
    { value: "302", label: "302 Found" },
    { value: "304", label: "304 Not Modified" },
    { value: "400", label: "400 Bad Request" },
    { value: "401", label: "401 Unauthorized" },
    { value: "403", label: "403 Forbidden" },
    { value: "404", label: "404 Not Found" },
    { value: "500", label: "500 Internal Server Error" },
    { value: "502", label: "502 Bad Gateway" },
    { value: "503", label: "503 Service Unavailable" },
]

export const httpMethods = [
    { value: "GET", label: "GET", color: "text-blue-500" },
    { value: "POST", label: "POST", color: "text-green-500" },
    { value: "PUT", label: "PUT", color: "text-yellow-500" },
    { value: "PATCH", label: "PATCH", color: "text-orange-500" },
    { value: "DELETE", label: "DELETE", color: "text-red-500" },
    { value: "HEAD", label: "HEAD", color: "text-purple-500" },
    { value: "OPTIONS", label: "OPTIONS", color: "text-indigo-500" },
    { value: "TRACE", label: "TRACE", color: "text-pink-500" },
]
