import { IGRPContainer } from '@igrp/igrp-design-system'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
import { OPTION_TYPE } from '@renderer/constants/appConstants'
import { FileCode, Database, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const EmptyPage = ({ onClick }) => {
  const { t } = useTranslation()

  const actions = [
    {
      title: t('newObject', { name: t('model') }),
      icon: <Database className="h-6 w-6" />,
      onClick: () => onClick(OPTION_TYPE.MODELS)
    },
    {
      title: t('newObject', { name: t('controller') }),
      icon: <FileCode className="h-6 w-6" />,
      onClick: () => onClick(OPTION_TYPE.ACTION)
    },
    {
      title: t('newDto'),
      icon: <FileText className="h-6 w-6" />,
      onClick: () => onClick(OPTION_TYPE.DATA_OBJECTS)
    }
  ]

  return (
    <IGRPContainer>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {actions.map((action, key) => (
          <Card
            key={key}
            className="group hover:border-primary/50 transition-colors cursor-pointer"
            onClick={action.onClick}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center space-y-4">
              <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                {action.icon}
              </div>
              <Button variant="default" className="w-full">
                {action.title}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </IGRPContainer>
  )
}

export default EmptyPage
