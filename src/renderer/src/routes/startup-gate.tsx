import Loader from '@renderer/components/loader'
import { ROUTES } from '@renderer/routes/routeConstants'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Resolves onboarding settings before choosing `/welcome` vs IDE so returning users
 * never flash the welcome UI on cold start.
 */
export default function StartupGate() {
    const navigate = useNavigate()

    useEffect(() => {
        let cancelled = false
        void (async () => {
            try {
                const completed = await window.igrpStudioSettings.getWelcomeOnboardingCompleted()
                if (cancelled) return
                if (completed === true) {
                    navigate(ROUTES.PATH_IDE_INITIAL_SCREEN, { replace: true })
                } else {
                    navigate(ROUTES.PATH_WELCOME_ONBOARDING, { replace: true })
                }
            } catch {
                if (!cancelled) {
                    navigate(ROUTES.PATH_WELCOME_ONBOARDING, { replace: true })
                }
            }
        })()
        return () => {
            cancelled = true
        }
    }, [navigate])

    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader variant="fullscreen" className="h-screen w-full" />
        </div>
    )
}
