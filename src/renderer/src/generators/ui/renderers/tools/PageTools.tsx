import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@renderer/components/ui/tooltip'
// Adjust the import path based on your project structure
import { Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ToolsProps {
    onEdit: () => void
}

const PageTools = ({ onEdit }: ToolsProps) => {
    const { t } = useTranslation()
    return (
        <div className="absolute z-10 right-0 rounded opacity-0 group-hover/page:opacity-100 transition-opacity duration-200 bg-gray-600 text-white">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className="flex items-center justify-center p-1 hover:bg-white hover:text-black rounded"
                            onClick={onEdit}
                        >
                            <Settings className="h-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t('edit')}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}

export default PageTools
