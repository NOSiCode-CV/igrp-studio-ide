import { IGRPButtonPrimitive, IGRPRadioGroup } from '@igrp/igrp-framework-react-design-system'
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext'
import { StructuredComponent } from '@renderer/lib/dnd/types'
import { useTranslation } from 'react-i18next'
import { FileTree } from 'src/main/types'
import { useMemo, useState, useEffect, JSX } from 'react'
import { useDispatch } from 'react-redux'
import { getFileThree as onGetPages } from '@renderer/redux/thunks'
import useStudio from '@renderer/hooks/use-studio'
import { SelectInput } from '@renderer/generators/api/components/inputs-form'
import { useComponents } from '../../hooks/useComponents'

interface CopyContentProps {
  currentComp: StructuredComponent | undefined
}

interface PageOption extends FileTree {
  isPage: boolean
  components?: StructuredComponent
  pageName?: string
}

interface ActivityContent {
  processKey: string
  type: 'processStep'
  pageName: string
  name: string
  description?: string
  components?: StructuredComponent & {
    componentName?: string
    tag?: string
    label?: string
  }
}

const CopyContent = ({ currentComp }: CopyContentProps): JSX.Element => {
  const { t } = useTranslation()
  const { handleUpdateChildComponent } = useDroppedComponents()
  const { extractComponentsFromPage } = useComponents()
  const [sourceType, setSourceType] = useState<'pages' | 'components' | 'processStep'>('pages')
  const [selectedPage, setSelectedPage] = useState<string>('')
  const [selectedPageComponent, setSelectedPageComponent] = useState<StructuredComponent | null>(
    null
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dispatch: any = useDispatch()
  const { basePath, files } = useStudio()

  useEffect(() => {
    dispatch(onGetPages(basePath))
  }, [basePath, dispatch])

  const pageOptions = useMemo((): {
    pages: PageOption[]
    components: PageOption[]
    processSteps: PageOption[]
  } => {
    if (!files) return { pages: [], components: [], processSteps: [] }

    const getPageComponent = (pageName: string): FileTree[] => {
      const pageFile = files
        .find((file: FileTree) => file.name === 'pages')
        ?.children?.find((child: FileTree) => child.name === pageName)

      return (
        pageFile?.children?.map((comp: FileTree) => ({
          ...comp?.content,
          ...comp,
          pageName: comp?.content?.name,
          pagePath: comp?.content?.path,
          isPage: false
        })) || []
      )
    }

    const pages = files.find((file: FileTree) => file.name === 'pages')?.children || []
    const components = files.find((file: FileTree) => file.name === 'components')?.children || []
    const processSteps = files.find((file: FileTree) => file.name === 'process')?.children || []

    const pageOptions: PageOption[] = pages.map(
      (page: FileTree) =>
        ({
          ...page?.content,
          ...page,
          pagePath: page.content?.path,
          isPage: true,
          children: getPageComponent(page.content.pageName)
        }) as PageOption
    )

    const componentOptions: PageOption[] = components.map(
      (component: FileTree) =>
        ({
          ...component?.content,
          ...component,
          pagePath: component.content?.path,
          isPage: false,
          children: []
        }) as PageOption
    )

    // Extract activity files from nested process structure: process -> processKey -> version -> activities
    const processStepOptions: PageOption[] = []

    processSteps.forEach((process: FileTree) => {
      if (!process.children || !Array.isArray(process.children)) return

      // Get version folders (v1, v2, etc.)
      const versionFolders = process.children.filter(
        (child: FileTree) => child.isDirectory && /^v\d+$/.test(child.name)
      )

      if (versionFolders.length > 0) return

      // Extract activity files (files starting with "Activity_" and ending with ".json")
      process.children.forEach((file: FileTree) => {
        if (!file.isDirectory && file.content.type === 'processStep') {
          // Convert activity content to StructuredComponent format
          const activityContent = file.content as ActivityContent
          const rootComponent = activityContent.components

          console.log(activityContent)

          processStepOptions.push({
            ...file.content,
            pagePath: file.path,
            isPage: false,
            name: `${activityContent.description} - ${activityContent.processKey}`,
            pageName: `${activityContent.name}#${activityContent.processKey}`,
            components: rootComponent as StructuredComponent,
            children: []
          } as PageOption)
        }
      })
    })

    return {
      pages: pageOptions,
      components: componentOptions,
      processSteps: processStepOptions
    }
  }, [files])

  const availableComponents = useMemo(() => {
    if (!selectedPage || !currentComp) return []

    let currentOptions: PageOption[] = []
    if (sourceType === 'pages') {
      currentOptions = pageOptions.pages
    } else if (sourceType === 'components') {
      currentOptions = pageOptions.components
    } else if (sourceType === 'processStep') {
      currentOptions = pageOptions.processSteps
    }

    if (!currentOptions.length) return []

    const selectedItem = currentOptions.find(
      (p: PageOption) =>
        p.content?.pageName === selectedPage ||
        p.content?.name === selectedPage ||
        p.pageName === selectedPage ||
        p.name === selectedPage
    )

    if (!selectedItem || !selectedItem.components) return []

    const componentsMap = extractComponentsFromPage(
      selectedItem.components,
      currentComp.componentName
    )

    const allComponents = Array.from(componentsMap.values())

    return allComponents

    // return allComponents.filter((comp) => comp.id !== currentComp.id)
  }, [selectedPage, currentComp, pageOptions, sourceType, extractComponentsFromPage])

  const handleSourceTypeChange = (value: string): void => {
    setSourceType(value as 'pages' | 'components' | 'processStep')
    setSelectedPage('')
    setSelectedPageComponent(null)
  }

  const handlePageChange = (value: string | boolean): void => {
    setSelectedPage(value as string)
    setSelectedPageComponent(null)
  }

  const handleComponentChange = (value: string | boolean): void => {
    const selected = availableComponents.find((c) => c.id === value)
    setSelectedPageComponent(selected || null)
  }

  const handleCopyClick = (): void => {
    if (!selectedPageComponent || !currentComp) return

    const childrenToCopy = selectedPageComponent.children || []
    handleUpdateChildComponent(currentComp.id, {
      ...currentComp,
      properties: selectedPageComponent.properties,
      children: [...childrenToCopy] ///[...(currentComp.children || []), ...childrenToCopy]
    })
  }

  const pageSelectOptions = useMemo(
    () =>
      pageOptions.pages.map((item: PageOption) => ({
        label: item.content.description || item.content.pageName || item.content.name,
        value: item.content.pageName || item.content.name
      })),
    [pageOptions]
  )

  const componentSelectSourceOptions = useMemo(
    () =>
      pageOptions.components.map((item: PageOption) => ({
        label: item.content.description || item.content.name,
        value: item.content.name
      })),
    [pageOptions]
  )

  const componentSelectOptions = useMemo(
    () =>
      availableComponents.map((comp: StructuredComponent) => ({
        label: `${comp.label || comp.tag} - ${comp.tag}`,
        value: comp.id
      })),
    [availableComponents]
  )

  const processStepSelectOptions = useMemo(
    () =>
      pageOptions.processSteps.map((item: PageOption) => ({
        label: item.name,
        value: item.pageName
      })) || [],
    [pageOptions]
  )

  return (
    <div className="flex flex-col gap-2 space-y-3">
      <p className="text-sm font-medium">Copy Content</p>
      <div className="flex flex-col gap-2 space-y-3">
        <IGRPRadioGroup
          id="source-type"
          name="source-type"
          value={sourceType}
          onValueChange={handleSourceTypeChange}
          options={[
            { value: 'pages', label: t('Pages') },
            { value: 'components', label: t('Components') },
            { value: 'processStep', label: t('Process Step') }
          ]}
        />

        <SelectInput
          id="page"
          placeholder={
            sourceType === 'pages'
              ? t('Select a page')
              : sourceType === 'components'
                ? t('Select a component')
                : t('Select a process step')
          }
          options={
            sourceType === 'pages'
              ? pageSelectOptions
              : sourceType === 'components'
                ? componentSelectSourceOptions
                : processStepSelectOptions
          }
          onChange={handlePageChange}
          name="page"
          label={
            sourceType === 'pages'
              ? t('Pages')
              : sourceType === 'components'
                ? t('Components')
                : t('Process Step')
          }
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
  )
}

export default CopyContent
