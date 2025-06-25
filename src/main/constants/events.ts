export const EVENTS = {
    ENGINE: {
        CREATE_PROJECT: 'engine:create-project',
        CREATE_PERMISSION: 'engine:create-permission',
        DELETE_ELEMENT: 'engine:delete-element',
        SERIALIZE_ELEMENT: 'engine:serialize-element',
        GET_DEPENDENCIES: 'engine:dependencies',
    },
    SPRING: {
        CREATE_MODULE: 'spring-engine:create-module',
        CREATE_MODEL: 'spring-engine:create-model',
        CREATE_DTO: 'spring-engine:create-dto',
        CREATE_ENUM: 'spring-engine:create-enum',
        CREATE_RESPONSE: 'spring-engine:create-response',
        CREATE_CONTROLLER: 'spring-engine:create-controller',
        FETCH_SELECTORS: 'spring-engine:fetch-selectors'
    },
    NEXT: {
        CREATE_PAGE: 'next-engine:create-page',
        DELETE_PAGE: 'next-engine:delete-page',
        REGISTRY_COMPONENT: 'engine:registry-component',
        GET_COMPONENT: 'engine:get-component',
        GET_SERVICE: 'engine:get-service',
        GET_CODE_SNIPPET: 'engine:get-code-snippet',
        LOAD_METADATA: 'engine:load-metadata',
        REGISTER_COMPONENT: 'engine:register-component'

    },
    REPOSITORY: {
        INITIALIZE: 'repository:initialize',
        WORKSPACE: {
            GET_CURRENT: 'repository:workspace:get-current',
            CREATE: 'repository:workspace:create',
            UPDATE: 'repository:workspace:update',
            DELETE: 'repository:workspace:delete',
            GET: 'repository:workspace:get',
            FIND_ALL: 'repository:workspace:find-all',
            FIND_RECENT: 'repository:workspace:find-recent',
            SAVE_CUSTOM_YAML: 'engine:save-custom-ymal'
        },
        PROJECT: {
            CREATE: 'repository:project:create',
            UPDATE: 'repository:project:update',
            DELETE: 'repository:project:delete',
            GET: 'repository:project:get',
            FIND_ALL: 'repository:project:find-all',
            FIND_RECENT: 'repository:project:find-recent',
            CONFIGURE_SERVICE: 'repository:configure-service'
        },
        SERVICE: {
            CREATE: 'repository:service:create',
            UPDATE: 'repository:service:update',
            DELETE: 'repository:service:delete',
            FIND_ALL: 'repository:service:find-all',
        },
        BACKUP: {
            CREATE: 'repository:backup:create',
            RESTORE: 'repository:backup:restore'
        }
    },
    APPLOGIC:{
        CREATE: 'app-logic:add-environment',
        REATE: 'repository:service:create',
        UPDATE: 'app-logic:update-environment',
        DELETE: 'app-logic:delete-environment',
        GET: 'app-logic:get-environment',
        FIND_ALL: 'app-logic:get-environments',
        SEARCH: 'app-logic:search-environments',
        CHANGE: 'app-logic:environments-changed',
        TEST: 'app-logic:test-environment'

    },
    ERROR: 'error',
    LOG: 'log'
};


export const ERROR_CODES = {
    WORKSPACE: {
        CREATE_FAILED: 'workspace:create-failed',
        UPDATE_FAILED: 'workspace:update-failed',
        DELETE_FAILED: 'workspace:delete-failed',
        NOT_FOUND: 'workspace:not-found'
    },
    PROJECT: {
        CREATE_FAILED: 'project:create-failed',
        UPDATE_FAILED: 'project:update-failed',
        DELETE_FAILED: 'project:delete-failed',
        NOT_FOUND: 'project:not-found'
    },
    BACKUP: {
        FAILED: 'backup:failed',
        RESTORE_FAILED: 'backup:restore-failed'
    },
    ERROR: 'error',
};