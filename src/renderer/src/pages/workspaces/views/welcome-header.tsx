import { Headline } from '@renderer/components/shared-ui'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import { FolderKanban } from 'lucide-react'

const WelcomeHeader = () => {
    const { workspace } = useWorkspace()

    return (
        <div className="flex items-center justify-between mb-4">
            <Headline
                icon={FolderKanban}
                title={workspace.name}
                description={workspace.description}
            />
        </div>
    )
}

export default WelcomeHeader
