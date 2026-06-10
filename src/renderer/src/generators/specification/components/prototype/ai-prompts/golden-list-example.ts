/**
 * Golden anatomy embedded in the Prototype's system prompt so the LLM
 * sees the real shape it has to emit (engine `additionalProperties:
 * false` + Next.js route-segment regex on `path` are unforgiving when
 * the LLM extrapolates from training data).
 *
 * Built from an anonymised version of a real validated manifest
 * (`inss-sisgb-core-mono-frontend/.igrpstudio/pages/contribuintes.json`).
 *
 * Demonstrates:
 *   - `page` → `section` → `pageHeader`
 *   - filter strip (`container` + `inputSearch`)
 *   - `table` with `tableColumns` cells + `tableTextCell` + `tableBadgeCell`
 *
 * Extracted from `PrototypePanel.tsx` (M7) as part of the prototype
 * refactor (P1) so the constant is shareable across prompt builders
 * without dragging the whole panel module along.
 */
export const GOLDEN_LIST_PAGE_EXAMPLE = JSON.stringify(
    {
        type: 'page',
        pageName: 'entities',
        path: 'entities',
        description: 'List of entities',
        forceDynamic: false,
        id: 'page_entities',
        args: [],
        types: [],
        states: [
            {
                id: 'state_showFilter',
                name: 'showFilter',
                type: 'boolean',
                defaultValue: 'false',
                imports: []
            },
            {
                id: 'state_searchValue',
                name: 'searchValue',
                type: 'string',
                defaultValue: "''",
                imports: []
            }
        ],
        functions: [],
        imports: [],
        components: {
            id: 'page_root',
            componentName: 'page',
            tag: 'page1',
            label: 'page',
            properties: { variant: 'default', commonProperties: {} },
            interactions: {},
            data: {},
            children: [
                {
                    id: 'section_main',
                    componentName: 'section',
                    tag: 'section1',
                    label: 'section',
                    properties: { spaceX: '3', spaceY: '6', commonProperties: {} },
                    interactions: {},
                    data: {},
                    children: [
                        {
                            id: 'pageheader_main',
                            componentName: 'pageHeader',
                            tag: 'pageHeader1',
                            label: 'Page Header',
                            type: 'group',
                            allowTypes: false,
                            properties: {
                                title: 'Entities',
                                description: 'Manage entities in the system',
                                variant: 'h3',
                                commonProperties: { generateReference: false }
                            },
                            interactions: {},
                            data: {},
                            children: [],
                            childProperties: {}
                        },
                        {
                            id: 'container_filter',
                            componentName: 'container',
                            tag: 'container1',
                            label: 'Container',
                            type: 'group',
                            allowTypes: false,
                            properties: { className: 'px-4 pt-2 space-y-3', commonProperties: {} },
                            interactions: {},
                            data: {},
                            children: [
                                {
                                    id: 'inputsearch_main',
                                    componentName: 'inputSearch',
                                    tag: 'inputSearch1',
                                    label: 'Input Search',
                                    type: 'group',
                                    allowTypes: false,
                                    properties: {
                                        label: '',
                                        placeholder: 'Search by name…',
                                        required: false,
                                        showSubmitButton: true,
                                        submitButtonLabel: 'Search',
                                        iconProperties: {
                                            showStartIcon: true,
                                            startIcon: 'Search'
                                        },
                                        commonProperties: { generateReference: false }
                                    },
                                    interactions: {},
                                    data: {},
                                    children: [],
                                    childProperties: {}
                                }
                            ],
                            childProperties: {}
                        },
                        {
                            id: 'table_entities',
                            componentName: 'table',
                            tag: 'table1',
                            label: 'Table',
                            type: 'group',
                            allowTypes: true,
                            dataType: 'entityRow',
                            properties: {
                                showFilter: true,
                                showPagination: true,
                                commonProperties: { generateReference: false }
                            },
                            interactions: {},
                            data: {},
                            childProperties: {},
                            children: [
                                {
                                    id: 'tablecolumns_main',
                                    componentName: 'tableColumns',
                                    tag: 'tableColumns1',
                                    label: 'Table Column',
                                    properties: { commonProperties: {} },
                                    interactions: {},
                                    data: {},
                                    childProperties: {},
                                    children: [
                                        {
                                            id: 'tabletextcell_name',
                                            componentName: 'tableTextCell',
                                            tag: 'name',
                                            label: 'Text Column',
                                            type: '',
                                            allowTypes: false,
                                            properties: {
                                                headerTitle: 'Name',
                                                variant: 'default',
                                                headerType: 'sortToggle',
                                                commonProperties: { generateReference: false }
                                            },
                                            interactions: {},
                                            data: {},
                                            children: [],
                                            childProperties: {}
                                        },
                                        {
                                            id: 'tablebadgecell_status',
                                            componentName: 'tableBadgeCell',
                                            tag: 'status',
                                            label: 'Badge Column',
                                            type: '',
                                            allowTypes: false,
                                            properties: {
                                                headerTitle: 'Status',
                                                variant: 'soft',
                                                commonProperties: { generateReference: false }
                                            },
                                            interactions: {},
                                            data: {},
                                            children: [],
                                            childProperties: {}
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    childProperties: {}
                }
            ],
            childProperties: {}
        }
    },
    null,
    2
)
