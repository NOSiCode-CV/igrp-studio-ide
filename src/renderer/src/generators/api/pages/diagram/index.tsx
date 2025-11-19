import { convertModelData } from './convertModelData'
import ERDDiagram from './ERDDiagram'
import { useEffect, useState } from 'react'
import { ModelData, RelationData } from './types'
import useStudioAPI from '@renderer/hooks/use-studio-api'
import { useTranslation } from 'react-i18next'

export default function ERDLayout({ currentItem }: { currentItem: any }) {
  const { t } = useTranslation()
  const { models } = useStudioAPI(currentItem?.module)

  const [convertedModelData, setConvertedModelData] = useState<ModelData[] | null>(null)
  const [relations, setRelations] = useState<RelationData[] | null>(null)

  useEffect(() => {
    if (models) {
      const { models: modelData, relations } = convertModelData(models)

      setConvertedModelData(modelData)

      setRelations(relations)
    }
  }, [models])

  return (
    <>
      {convertedModelData && relations ? (
        <ERDDiagram models={convertedModelData} relations={relations} />
      ) : (
        <p className="text-foreground">{t('loadingDiagram')}</p>
      )}
    </>
  )
}
