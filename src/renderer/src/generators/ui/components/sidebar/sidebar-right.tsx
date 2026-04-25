import {
    IGRPSidebarContentPrimitive,
    IGRPSidebarPrimitive,
    IGRPTabsContentPrimitive,
    IGRPTabsListPrimitive,
    IGRPTabsPrimitive,
    IGRPTabsTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { EmptyList } from '@renderer/components/empty-list'
import Loader from '@renderer/components/loader'
import useStudio from '@renderer/hooks/use-studio'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { Settings } from 'lucide-react'
import { type ComponentProps, memo } from 'react'
import { useTranslation } from 'react-i18next'
import useCustomCode from '../../hooks/useCustomCode'
import { useSidebarRightState } from '../../hooks/useSidebarRightState'
import Interactions from '../settings/Interactions'
import { StyleTab } from '../settings/style'
import CopyContent from './copy-content'
import ComponentIdentitySection from './sidebar-right-identity'
import SidebarRightHeader from './sidebar-right-header'
import PropertiesPanel from './sidebar-right-properties-panel'

interface SidebarRightProps extends ComponentProps<typeof IGRPSidebarPrimitive> {
    comp?: StructuredComponent
    parentComp?: StructuredComponent
    path?: string
}

const SidebarRight = ({ comp, path, parentComp, ...props }: SidebarRightProps) => {
    const { t } = useTranslation()
    const { pageOptions } = useStudio()
    const { statesOptions } = useCustomCode()

    const {
        currentComp,
        currentPath,
        isRootComponent,
        label,
        componentName,
        componentId,
        tempEditingComponent,
        propsComponent,
        propsComponentChild,
        childformValues,
        columnsOptions,
        isLoading,
        handleUpdateChildComponent,
        restData,
        handleComponentPropertyChange,
        handleChildPropertyChange,
        handleSelectState,
        handleTagChange,
        handleUseClientChange,
        resetTempData,
        handleClose
    } = useSidebarRightState({ comp, parentComp, path })

    return (
        <IGRPSidebarPrimitive
            collapsible="none"
            className="overflow-hidden *:data-[sidebar=sidebar]:flex-row top-(--header-height-two)! h-[calc(100svh-var(--header-height-three))]!"
            {...props}
            style={
                {
                    '--sidebar-width': '380px'
                } as React.CSSProperties & { '--sidebar-width': string }
            }
        >
            <SidebarRightHeader
                componentName={componentName}
                showActions={!comp}
                onReset={resetTempData}
                onClose={handleClose}
            />
            <IGRPSidebarContentPrimitive>
                <div className="space-y-4 p-2 px-3">
                    {isLoading ? (
                        <Loader />
                    ) : !tempEditingComponent ? (
                        <EmptyList
                            icon={<Settings />}
                            title={t('settingsComponents')}
                            description={t('selectComponentToEdit')}
                        />
                    ) : (
                        <>
                            <ComponentIdentitySection
                                label={label}
                                componentName={componentName}
                                componentId={componentId}
                                tag={tempEditingComponent.tag}
                                isRootComponent={isRootComponent}
                                useClient={restData?.useClient ?? true}
                                onTagChange={handleTagChange}
                                onUseClientChange={handleUseClientChange}
                            />
                            <IGRPTabsPrimitive className="flex-1" defaultValue="props">
                                <IGRPTabsListPrimitive className="grid w-full grid-cols-4">
                                    <IGRPTabsTriggerPrimitive value="props">
                                        {t('props')}
                                    </IGRPTabsTriggerPrimitive>
                                    <IGRPTabsTriggerPrimitive value="styles">
                                        {t('style')}
                                    </IGRPTabsTriggerPrimitive>
                                    <IGRPTabsTriggerPrimitive value="interactions">
                                        {t('interactions')}
                                    </IGRPTabsTriggerPrimitive>
                                    <IGRPTabsTriggerPrimitive value="copy-content">
                                        {t('copy')}
                                    </IGRPTabsTriggerPrimitive>
                                </IGRPTabsListPrimitive>

                                <IGRPTabsContentPrimitive value="props" className="space-y-6">
                                    <PropertiesPanel
                                        propsComponent={propsComponent}
                                        propsComponentChild={propsComponentChild}
                                        tempEditingComponent={tempEditingComponent}
                                        childformValues={childformValues}
                                        pageOptions={pageOptions}
                                        statesOptions={statesOptions}
                                        columnsOptions={columnsOptions}
                                        onComponentPropertyChange={handleComponentPropertyChange}
                                        onChildPropertyChange={handleChildPropertyChange}
                                        onSelectState={handleSelectState}
                                    />
                                </IGRPTabsContentPrimitive>
                                <IGRPTabsContentPrimitive value="styles" className="space-y-6">
                                    <StyleTab
                                        comp={tempEditingComponent}
                                        path={currentPath}
                                        onInteranctionsChange={handleUpdateChildComponent}
                                    />
                                </IGRPTabsContentPrimitive>
                                <IGRPTabsContentPrimitive
                                    value="interactions"
                                    className="space-y-6"
                                >
                                    <Interactions
                                        comp={tempEditingComponent}
                                        path={currentPath}
                                        onInteranctionsChange={handleUpdateChildComponent}
                                        columnsOptions={columnsOptions}
                                    />
                                </IGRPTabsContentPrimitive>
                                <IGRPTabsContentPrimitive
                                    value="copy-content"
                                    className="space-y-6"
                                >
                                    <CopyContent currentComp={currentComp} />
                                </IGRPTabsContentPrimitive>
                            </IGRPTabsPrimitive>
                        </>
                    )}
                </div>
            </IGRPSidebarContentPrimitive>
        </IGRPSidebarPrimitive>
    )
}

export default memo(SidebarRight)
