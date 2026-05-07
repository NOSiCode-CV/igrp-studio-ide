export const EVENTS = {
    ENGINE: {
        CREATE_PROJECT: 'engine:create-project',
        CREATE_PERMISSION: 'engine:create-permission',
        DELETE_ELEMENT: 'engine:delete-element',
        DUPLICATE_ELEMENT: 'engine:duplicate-element',
        SERIALIZE_ELEMENT: 'engine:serialize-element',
        GET_DEPENDENCIES: 'engine:dependencies'
    },
    SPRING: {
        CREATE_MODULE: 'spring-engine:create-module',
        CREATE_MODEL: 'spring-engine:create-model',
        CREATE_DTO: 'spring-engine:create-dto',
        CREATE_ENUM: 'spring-engine:create-enum',
        CREATE_RESPONSE: 'spring-engine:create-response',
        CREATE_CONTROLLER: 'spring-engine:create-controller',
        CREATE_GRAPHQL_SCHEMA: 'spring-engine:create-graphql-schema',
        FETCH_SELECTORS: 'spring-engine:fetch-selectors'
    },
    GRAPHQL: {
        CREATE_OPERATION: 'graphql:create-operation',
        UPDATE_OPERATION: 'graphql:update-operation',
        DELETE_OPERATION: 'graphql:delete-operation',
        LIST_OPERATIONS: 'graphql:list-operations'
    },
    NEXT: {
        CREATE_PAGE: 'next-engine:create-page',
        CREATE_PROCESS: 'next-engine:create-process',
        DELETE_PAGE: 'next-engine:delete-page',
        REGISTRY_COMPONENT: 'engine:registry-component',
        GET_COMPONENT: 'engine:get-component',
        GET_SERVICE: 'engine:get-service',
        GET_CODE_SNIPPET: 'engine:get-code-snippet',
        LOAD_METADATA: 'engine:load-metadata',
        REGISTER_COMPONENT: 'engine:register-component',
        CREATE_PROCESS_STEP: 'engine:create-process-step',
        CONVERT_JSON_SCHEMA: 'next-engine:convert-json-schema'
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
            OPEN: 'repository:workspace:open',
            INSTALL_OPTIONAL_STACKS: 'repository:workspace:install-optional-stacks',
            GET_OPTIONAL_STACKS_STATUS: 'repository:workspace:get-optional-stacks-status',
            SAVE_CUSTOM_YAML: 'engine:save-custom-ymal'
        },
        PROJECT: {
            CREATE: 'repository:project:create',
            UPDATE: 'repository:project:update',
            DELETE: 'repository:project:delete',
            GET: 'repository:project:get',
            FIND_ALL: 'repository:project:find-all',
            FIND_RECENT: 'repository:project:find-recent',
            CONFIGURE_SERVICE: 'repository:configure-service',
            ADD_TO_WORKSPACE: 'repository:project:add-to-workspace'
        },
        SERVICE: {
            CREATE: 'repository:service:create',
            UPDATE: 'repository:service:update',
            DELETE: 'repository:service:delete',
            FIND_ALL: 'repository:service:find-all'
        },
        BACKUP: {
            CREATE: 'repository:backup:create',
            RESTORE: 'repository:backup:restore'
        }
    },
    APPLOGIC: {
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
    // BPMN 'igrp-studio-settings:get-bpmn-configs
    BPMN: {
        GET_CONFIGS: 'igrp-studio-settings:get-bpmn-configs',
        GET_CONFIG: 'igrp-studio-settings:get-bpmn-config',
        ADD_CONFIG: 'igrp-studio-settings:add-bpmn-config',
        UPDATE_CONFIG: 'igrp-studio-settings:update-bpmn-config',
        DELETE_CONFIG: 'igrp-studio-settings:delete-bpmn-config',
        SET_ACTIVE_CONFIG: 'igrp-studio-settings:set-active-bpmn-config',
        DELETE_ALL_CONFIGS: 'igrp-studio-settings:delete-all-bpmn-configs',
        SET_SELECTED_PROJECT: 'igrp-studio-settings:set-selected-bpmn-project',
        GET_SELECTED_PROJECT: 'igrp-studio-settings:get-selected-bpmn-project',
        SET_SELECTED_PROCESS: 'igrp-studio-settings:set-selected-bpmn-process',
        GET_SELECTED_PROCESS: 'igrp-studio-settings:get-selected-bpmn-process'
    },
    LANGUAGE: {
        GET_LANGUAGE: 'igrp-studio-settings:get-language',
        SET_LANGUAGE: 'igrp-studio-settings:set-language'
    },
    ONBOARDING: {
        GET_WELCOME_COMPLETED: 'igrp-studio-settings:get-welcome-onboarding-completed',
        SET_WELCOME_COMPLETED: 'igrp-studio-settings:set-welcome-onboarding-completed'
    },
    CONNECTION: {
        GET_CONNECTIONS: 'igrp-studio-settings:get-connections',
        SAVE_CONNECTION: 'igrp-studio-settings:save-connection',
        DELETE_CONNECTION: 'igrp-studio-settings:delete-connection',
        CONNECT_DATABASE: 'igrp-studio-settings:connect-database',
        GET_TABLES: 'igrp-studio-settings:get-tables',
        GET_TABLE_STRUCTURE: 'igrp-studio-settings:get-table-structure'
    },
    DOCKER: {
        UP: 'docker-up',
        DEPLOY_PROJECT: 'docker-deploy-project',
        DOWN: 'docker-down',
        STATUS: 'docker-status',
        STOP: 'docker-stop',
        RESTART: 'docker-restart',
        CHECK: 'docker-check',
        DAEMON_STATUS: 'docker-daemon-status'
    },
    MARKITDOWN: {
        OPEN_WINDOW: 'markitdown:open-window',
        CONVERT: 'markitdown:convert',
        PICK_FILE: 'markitdown:pick-file',
        SAVE_MARKDOWN: 'markitdown:save-markdown',
        GET_HISTORY: 'markitdown:get-history',
        DELETE_HISTORY_ITEM: 'markitdown:delete-history-item',
        CLEAR_HISTORY: 'markitdown:clear-history'
    },
    SPEC_KB: {
        ADD_FILE: 'spec:kb:add-file',
        ADD_URL: 'spec:kb:add-url',
        LIST: 'spec:kb:list',
        GET: 'spec:kb:get',
        REMOVE: 'spec:kb:remove',
        REINDEX: 'spec:kb:reindex',
        SEARCH: 'spec:kb:search',
        PROGRESS: 'spec:kb:progress'
    },
    SPEC_LLM: {
        STATUSES: 'spec:llm:statuses',
        LIST_MODELS: 'spec:llm:list-models',
        CHAT_START: 'spec:llm:chat-start',
        CHAT_CANCEL: 'spec:llm:chat-cancel',
        CHAT_CHUNK: 'spec:llm:chat-chunk',
        DETECT_CLIS: 'spec:llm:detect-clis'
    },
    SPEC_SETTINGS: {
        GET_SECRETS_STATUS: 'spec:settings:get-secrets-status',
        SET_SECRET: 'spec:settings:set-secret',
        TEST_SECRET: 'spec:settings:test-secret',
        GET_PREFERENCES: 'spec:settings:get-preferences',
        SET_PREFERENCES: 'spec:settings:set-preferences'
    },
    SPEC_DOC: {
        LIST: 'spec:doc:list',
        READ: 'spec:doc:read',
        CREATE: 'spec:doc:create',
        UPDATE: 'spec:doc:update',
        MOVE: 'spec:doc:move',
        REMOVE: 'spec:doc:remove',
        CONVERT_AND_INSERT: 'spec:doc:convert-and-insert',
        EXPORT: 'spec:doc:export',
        CHANGED: 'spec:doc:changed'
    },
    SPEC_DATA: {
        LIST: 'spec:data:list',
        GET: 'spec:data:get',
        CREATE: 'spec:data:create',
        UPDATE: 'spec:data:update',
        REMOVE: 'spec:data:remove',
        REORDER: 'spec:data:reorder',
        APPLY_OPS: 'spec:data:apply-ops',
        IMPORT_FROM_DB: 'spec:data:import-from-db',
        DIFF_WITH_DB: 'spec:data:diff-with-db',
        EXPORT_DDL: 'spec:data:export-ddl',
        GENERATE_START: 'spec:data:generate-start',
        GENERATE_CANCEL: 'spec:data:generate-cancel',
        GENERATE_CHUNK: 'spec:data:generate-chunk',
        CHANGED: 'spec:data:changed'
    },
    SPEC_PROTOTYPE: {
        GENERATE_START: 'spec:prototype:generate-start',
        GENERATE_CANCEL: 'spec:prototype:generate-cancel',
        GENERATE_CHUNK: 'spec:prototype:generate-chunk',
        APPLY_OPS: 'spec:prototype:apply-ops',
        LIST_FILES: 'spec:prototype:list-files',
        READ_FILE: 'spec:prototype:read-file',
        START_DEV: 'spec:prototype:start-dev',
        STOP_DEV: 'spec:prototype:stop-dev',
        DEV_STATUS: 'spec:prototype:dev-status',
        DEV_LOG: 'spec:prototype:dev-log',
        GET_DEV_LOG_BUFFER: 'spec:prototype:get-dev-log-buffer',
        LIST_SNAPSHOTS: 'spec:prototype:list-snapshots',
        RESTORE_SNAPSHOT: 'spec:prototype:restore-snapshot',
        EXPORT: 'spec:prototype:export',
        TREE_CHANGED: 'spec:prototype:tree-changed'
    },
    ERROR: 'error',
    LOG: 'log'
}

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
    ERROR: 'error'
}
