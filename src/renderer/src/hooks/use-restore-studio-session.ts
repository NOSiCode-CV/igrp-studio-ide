import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { restoreActiveStudioSession } from '@renderer/redux/thunks'
import { ROUTES } from '@renderer/routes/routeConstants'
import type { RootState } from '@renderer/redux'

/**
 * After a hard refresh Redux loses the open project. Restore it from
 * localStorage before redirecting away from studio routes.
 */
export function useRestoreStudioSession(): { restoring: boolean; basePath: string } {
    const dispatch: any = useDispatch()
    const navigate = useNavigate()
    const basePath = useSelector((state: RootState) => state.PageBuilder.basePath)
    const [restoring, setRestoring] = useState(() => !basePath)

    useEffect(() => {
        let cancelled = false

        const run = async (): Promise<void> => {
            if (basePath) {
                if (!cancelled) setRestoring(false)
                return
            }

            if (!cancelled) setRestoring(true)
            const ok = await dispatch(restoreActiveStudioSession())
            if (cancelled) return

            if (!ok) {
                navigate(ROUTES.PATH_IDE_INITIAL_SCREEN, { replace: true })
            }
            setRestoring(false)
        }

        void run()
        return () => {
            cancelled = true
        }
    }, [basePath, dispatch, navigate])

    return { restoring, basePath }
}
