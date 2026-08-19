import { getAllModels, getMergedFiles } from './index'

describe('getMergedFiles', () => {
    it('merges nested directory nodes without requiring file content', () => {
        const studio = {
            filesThree: [
                {
                    name: 'Sales',
                    children: [
                        {
                            name: 'graphql',
                            children: [
                                {
                                    name: 'types',
                                    children: [
                                        {
                                            name: 'Order.json',
                                            content: { name: 'Order', module: 'Sales' }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    name: 'Shared',
                    children: [
                        {
                            name: 'graphql',
                            children: [
                                {
                                    name: 'types',
                                    children: [
                                        {
                                            name: 'Customer.json',
                                            content: { name: 'Customer', module: 'Shared' }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }

        expect(() => getMergedFiles(studio, 'Sales')).not.toThrow()

        const merged = getMergedFiles(studio, 'Sales')
        const graphql = merged.children.find((item: any) => item.name === 'graphql')
        const types = graphql?.children?.find((item: any) => item.name === 'types')
        expect(types?.children?.map((item: any) => item.name)).toEqual(['Order.json', 'Customer.json'])
    })
})

describe('getAllModels', () => {
    it('returns persisted models from every module for relation targets', () => {
        const filesThree = [
            {
                name: 'Customers',
                children: [
                    { name: 'models', children: [{ name: 'Customer.json', content: { module: 'Customers' } }] }
                ]
            },
            {
                name: 'Catalog',
                children: [
                    { name: 'models', children: [{ name: 'Product.json', content: { module: 'Catalog' } }] }
                ]
            },
            {
                name: 'Shared',
                children: [
                    { name: 'models', children: [{ name: 'Audit.json', content: { module: 'Shared' } }] }
                ]
            }
        ] as any

        expect(getAllModels(filesThree).map((item: any) => item.name)).toEqual([
            'Customer.json',
            'Product.json',
            'Audit.json'
        ])
    })
})
