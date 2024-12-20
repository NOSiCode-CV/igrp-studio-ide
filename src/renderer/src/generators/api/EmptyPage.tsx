import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
import { Database, FileCode, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const EmptyPage = ({ onClick }) => {
  const { t } = useTranslation()

  const actions = [
    {
      title: t('newObject', { name: t('model') }),
      icon: <Database className="h-6 w-6" />,
      onClick: () => onClick('models'),
      type: 'models'
    },
    {
      title: t('newObject', { name: t('controller') }),
      icon: <FileCode className="h-6 w-6" />,
      onClick: () => onClick('controllers'),
      type: 'controllers'
    },
    {
      title: t('newObject', { name: t('dto') }),
      icon: <FileText className="h-6 w-6" />,
      onClick: () => onClick('dto'),
      type: 'dto'
    }
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-4 bg-background">
      <div className="w-full max-w-4xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 gap-4">
          {actions.map((action) => (
            <Card
              key={action.type}
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
      </div>
    </div>
  )
}

export default EmptyPage
