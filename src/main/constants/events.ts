export const EVENTS = {
    ENGINE: {
        CREATE_PROJECT: 'engine:create-project',
        CREATE_RESPONSE: 'engine:create-response',
        CREATE_ENUM: 'engine:create-enum',
        CREATE_PERMISSION: 'engine:create-permission',
        DELETE_ELEMENT: 'engine:delete-element',
        SERIALIZE_ELEMENT: 'engine:serialize-element',
    },
    SPRING: {
        CREATE_MODULE: 'spring-engine:create-module',
        CREATE_MODEL: 'spring-engine:create-model',
        CREATE_DTO: 'spring-engine:create-dto',
        CREATE_CONTROLLER: 'spring-engine:create-controller',
        FETCH_SELECTORS: 'spring-engine:fetch-selectors'
    },
    NEXT: {
        CREATE_PAGE: 'next-engine:create-page',
        DELETE_PAGE: 'next-engine:delete-page',
        REGISTRY_COMPONENT: 'engine:registry-component',
        GET_COMPONENT: 'engine:get-component'
    }
};
