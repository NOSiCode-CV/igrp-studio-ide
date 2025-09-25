import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import { useTranslation } from 'react-i18next';
import { FileTree } from 'src/main/types';
import { useMemo, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getFileThree as onGetPages } from '@renderer/redux/thunks';
import useStudio from '@renderer/hooks/use-studio';
import { SelectInput } from '@renderer/generators/api/components/inputs-form';
import { useComponents } from '../../hooks/useComponents';

interface CopyContentProps {
    currentComp: StructuredComponent | undefined;
}

const CopyContent = ({ currentComp }: CopyContentProps) => {
    const { t } = useTranslation();
    const { handleUpdateChildComponent } = useDroppedComponents();
    const { extractComponentsFromPage } = useComponents();
    const [selectedPage, setSelectedPage] = useState<string>('');
    const [selectedPageComponent, setSelectedPageComponent] =
        useState<StructuredComponent | null>(null);

    const dispatch: any = useDispatch();
    const { basePath, files } = useStudio();

    useEffect(() => {
        dispatch(onGetPages(basePath));
    }, [basePath, dispatch]);

    const pageOptions = useMemo(() => {
        if (!files) return [];

        const getPageComponent = (pageName: string) => {
            const pageFile = files
                .find((file: FileTree) => file.name === 'pages')
                ?.children?.find((child: FileTree) => child.name === pageName);

            return (
                pageFile?.children?.map((comp: FileTree) => ({
                    ...comp?.content,
                    ...comp,
                    pageName: comp?.content?.name,
                    pagePath: comp?.content?.path,
                    isPage: false,
                })) || []
            );
        };

        const pages =
            files.find((file: FileTree) => file.name === 'pages')?.children ||
            [];

        return pages.map((page: FileTree) => ({
            ...page?.content,
            ...page,
            pagePath: page.content?.path,
            isPage: true,
            children: getPageComponent(page.content.pageName),
        }));
    }, [files]);

    const availableComponents = useMemo(() => {
        if (!selectedPage || !currentComp || !pageOptions.length) return [];

        const page = pageOptions.find(
            (p: any) => p.content.pageName === selectedPage
        );

        if (!page) return [];

        const componentsMap = extractComponentsFromPage(
            page.components,
            currentComp.componentName
        );

        const allComponents = Array.from(componentsMap.values());

        return allComponents.filter((comp) => comp.id !== currentComp.id);
    }, [selectedPage, currentComp, pageOptions, extractComponentsFromPage]);

    const handlePageChange = (value: string | boolean) => {
        setSelectedPage(value as string);
    };

    const handleComponentChange = (value: string | boolean) => {
        const selected = availableComponents.find((c) => c.id === value);
        setSelectedPageComponent(selected || null);
    };

    const handleCopyClick = () => {
        if (!selectedPageComponent || !currentComp) return;

        const childrenToCopy = selectedPageComponent.children || [];
        handleUpdateChildComponent(currentComp.id, {
            ...currentComp,
            properties: selectedPageComponent.properties,
            children: [...(currentComp.children || []), ...childrenToCopy],
        });
    };

    const pageSelectOptions = useMemo(
        () =>
            pageOptions.map((page: any) => ({
                label: page.content.description,
                value: page.content.pageName || page.content.name,
            })),
        [pageOptions]
    );

    const componentSelectOptions = useMemo(
        () =>
            availableComponents.map((comp: any) => ({
                label: `${comp.label || comp.tag} - ${comp.tag}`,
                value: comp.id,
            })),
        [availableComponents]
    );

    return (
        <div className="flex flex-col gap-2 space-y-3">
            <p className="text-sm font-medium">Copy Content</p>
            <div className="flex flex-col gap-2">
                <SelectInput
                    id="page"
                    placeholder="Select a page"
                    options={pageSelectOptions}
                    onChange={handlePageChange}
                    name="page"
                    label={t('Pages')}
                />

                <SelectInput
                    id="component"
                    options={componentSelectOptions}
                    onChange={handleComponentChange}
                    name="component"
                    label={t('Components')}
                />
                <IGRPButtonPrimitive className="mt-2" onClick={handleCopyClick}>
                    {t('Copy Properties')}
                </IGRPButtonPrimitive>
            </div>
        </div>
    );
};

export default CopyContent;
