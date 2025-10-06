import { useCallback } from 'react';
import { COMPONENT } from '../ComponentTypes';
import { faker } from '@faker-js/faker';
import { StructuredComponent } from '@renderer/lib/dnd/types';

export const useFakedata = () => {
    // Fake data generator for different component types
    const FAKE_COMPONENT_DATA: Record<string, any> = {
        [COMPONENT.Piechart]: {
            componentName: COMPONENT.Piechart,
            properties: {
                data: [
                    { browser: 'Chrome', users: 275 },
                    { browser: 'Safari', users: 200 },
                    { browser: 'Firefox', users: 187 },
                    { browser: 'Edge', users: 173 },
                    { browser: 'Other', users: 90 },
                ],
                nameKey: 'browser',
                pies: [{ dataKey: 'users' }],
            },
        },
        [COMPONENT.Areachart]: {
            componentName: COMPONENT.Areachart,
            properties: {
                title: 'Area Chart - Step',
                description: 'Step visualization of traffic',
                data: [
                    { mes: 'Jan', desktop: 420, mobile: 180, other: 90 },
                    { mes: 'Fev', desktop: 520, mobile: 230, other: 110 },
                    { mes: 'Mar', desktop: 610, mobile: 310, other: 150 },
                    { mes: 'Abr', desktop: 450, mobile: 260, other: 130 },
                    { mes: 'Mai', desktop: 480, mobile: 280, other: 140 },
                    { mes: 'Jun', desktop: 520, mobile: 290, other: 160 },
                ],
                areas: [
                    {
                        dataKey: 'desktop',
                        name: 'Desktop',
                        color: '#3b82f6',
                        type: 'step',
                    },
                ],
                categoryKey: 'mes',
                valueFormatter: (value: number) => `${value}`,
                footer: { description: 'January - June 2024' },
            },
        },
        [COMPONENT.VerticalBarchart]: {
            componentName: COMPONENT.VerticalBarchart,
            properties: {
                data: [
                    { produto: 'Notebook Pro X', satisfacao: 4.8 },
                    { produto: 'Smartphone Galaxy', satisfacao: 4.5 },
                    { produto: 'Tablet Ultra', satisfacao: 4.2 },
                    { produto: 'Monitor Curvo', satisfacao: 4.6 },
                    { produto: 'Teclado Mecânico', satisfacao: 4.7 },
                    { produto: 'Mouse Gamer', satisfacao: 4.4 },
                    { produto: 'Headset Wireless', satisfacao: 4.3 },
                ],
                bars: [
                    {
                        dataKey: 'satisfacao',
                        name: 'Satisfação',
                        color: '#f97316',
                    },
                ],
                categoryKey: 'produto',
                valueFormatter: (value: number) => `★ ${value.toFixed(1)}`,
            },
        },
        [COMPONENT.RadialBarchart]: {
            componentName: COMPONENT.RadialBarchart,
            properties: {
                title: 'Completion Status',
                description: 'Project Milestones',
                data: [
                    { task: 'Research', progress: 85 },
                    { task: 'Design', progress: 65 },
                    { task: 'Development', progress: 45 },
                    { task: 'Testing', progress: 20 },
                    { task: 'Deployment', progress: 10 },
                ],
                bars: [
                    {
                        dataKey: 'progress',
                        showLabels: true,
                        labelPosition: 'insideStart',
                        labelType: 'name',
                    },
                ],
                nameKey: 'task',
                size: 'lg',
                startAngle: 90,
                endAngle: -270,
                innerRadius: 20,
                outerRadius: 160,
                barSize: 20,
                showBackground: true,
                footer: {
                    description: 'Project status as of June 2024',
                },
                centerText: {
                    show: true,
                    value: 100,
                },
            },
        },
        [COMPONENT.HorizontalBarchart]: {
            componentName: COMPONENT.HorizontalBarchart,
            properties: {
                data: [
                    { mes: 'Janeiro', desktop: 186 },
                    { mes: 'Fevereiro', desktop: 305 },
                    { mes: 'Março', desktop: 237 },
                    { mes: 'Abril', desktop: 73 },
                    { mes: 'Maio', desktop: 209 },
                    { mes: 'Junho', desktop: 214 },
                ],
                bars: [{ dataKey: 'desktop', name: 'Desktop' }],
                categoryKey: 'mes',
            },
        },
        [COMPONENT.Linechart]: {
            componentName: COMPONENT.Linechart,
            properties: {
                data: [
                    { mes: 'Jan', desktop: 186, mobile: 320 },
                    { mes: 'Feb', desktop: 305, mobile: 220 },
                    { mes: 'Mar', desktop: 237, mobile: 110 },
                    { mes: 'Apr', desktop: 73, mobile: 190 },
                    { mes: 'May', desktop: 209, mobile: 230 },
                    { mes: 'Jun', desktop: 214, mobile: 270 },
                ],
                lines: [{ dataKey: 'desktop', color: 'var(--chart-1)' }],
                categoryKey: 'mes',
            },
        },
        [COMPONENT.Radarchart]: {
            componentName: COMPONENT.Radarchart,
            properties: {
                data: [
                    { month: 'January', desktop: 186, mobile: 80 },
                    { month: 'February', desktop: 305, mobile: 200 },
                    { month: 'March', desktop: 237, mobile: 120 },
                    { month: 'April', desktop: 73, mobile: 190 },
                    { month: 'May', desktop: 209, mobile: 130 },
                    { month: 'June', desktop: 214, mobile: 140 },
                ],
                radars: [{ dataKey: 'desktop', color: 'var(--chart-1)' }],
                angleAxisKey: 'month',
            },
        },
        [COMPONENT.Select]: {
            properties: {
                options: [
                    { value: 1, label: 'Option 1' },
                    { value: 2, label: 'Option 2' },
                ],
            },
        },
        [COMPONENT.Combobox]: {
            properties: {
                options: [
                    { value: 1, label: 'Option 1' },
                    { value: 2, label: 'Option 2' },
                ],
            },
        },
        [COMPONENT.TableSelectFilter]: {
            properties: {
                options: [
                    { value: 1, label: 'Option 1' },
                    { value: 2, label: 'Option 2' },
                ],
            },
        },
        [COMPONENT.TableFilterDropdown]: {
            properties: {
                options: [
                    { value: 1, label: 'Option 1' },
                    { value: 2, label: 'Option 2' },
                ],
            },
        },
        [COMPONENT.TableFacetedFilter]: {
            properties: {
                options: [
                    { value: 1, label: 'Option 1' },
                    { value: 2, label: 'Option 2' },
                ],
            },
        },
        [COMPONENT.StatsCard]: {
            properties: {
                value: faker.number.int({ min: 1, max: 1000 }),
            },
        },
        [COMPONENT.Radio]: {
            properties: {
                options: [
                    { value: 1, label: 'Option 1' },
                    { value: 2, label: 'Option 2' },
                ],
            },
        },
        [COMPONENT.Text]: {
            properties: {
                content: faker.lorem.paragraph(1),
            },
        },
        [COMPONENT.PdfViewer]: {
            properties: {
                fileUrl:
                    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            },
        },
        // Default fallback component
        Default: {
            componentName: 'UnknownComponent',
            properties: {
                commonProperties: {
                    label: 'Unknown Component',
                    visible: true,
                },
            },
        },
    };

    // Helper function to get fake data for a component
    const getFakeComponentData = (
        componentName: string
    ): StructuredComponent => {
        return (
            FAKE_COMPONENT_DATA[componentName] || FAKE_COMPONENT_DATA.Default
        );
    };

    const generateFakeDataForField = (componentType: string): any => {
        switch (componentType.toLowerCase()) {
            case 'text':
            case 'string':
                return faker.lorem.words(2);

            case 'number':
            case 'integer':
                return faker.number.int({ min: 1, max: 1000 });

            case 'date':
                return faker.date.past().toLocaleDateString();

            case 'boolean':
            case 'checkbox':
                return faker.datatype.boolean();

            case 'select':
            case 'dropdown':
                return faker.helpers.arrayElement([
                    'Option 1',
                    'Option 2',
                    'Option 3',
                ]);

            case 'email':
                return faker.internet.email();

            case 'phone':
                return faker.phone.number();

            case 'currency':
                return faker.finance.amount({ min: 0, max: 1000 });

            case 'color':
                return faker.internet.color();

            case 'url':
                return faker.internet.url();

            default:
                return 'Sample Data';
        }
    };

    const getComponentType = (componentName: string): string => {
        switch (componentName) {
            case COMPONENT.TableAmountCell:
                return 'currency';
            case COMPONENT.TableDateCell:
                return 'date';
            default:
                return 'text';
        }
    };

    const getDataTableFake = useCallback((columns: any) => {
        return Array.from({ length: 4 }).map(() => {
            const rowData: { [key: string]: any } = {};
            columns.forEach((child: any) => {
                const type = getComponentType(child.componentName);
                rowData[child.id] = generateFakeDataForField(type);
            });
            return rowData;
        });
    }, []);

    return {
        getDataTableFake,
        generateFakeDataForField,
        getFakeComponentData,
    };
};
