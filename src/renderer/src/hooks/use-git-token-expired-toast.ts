import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useToast from './useToast'

interface TokenExpiredDetail {
    providerType: 'github' | 'gitlab'
    status: number
}

/**
 * Surfaces a single toast when any git provider reports an expired token.
 * Mount once near the application root (e.g. inside the layout) — the
 * underlying CustomEvent is dispatched by the useGitAuth hook so this
 * stays decoupled from how many useGitAuth instances exist.
 */
export function useGitTokenExpiredToast(): void {
    const { t } = useTranslation()
    const { showErrorToast } = useToast()

    useEffect(() => {
        const onExpired = (event: Event): void => {
            const detail = (event as CustomEvent<TokenExpiredDetail>).detail
            const label = detail?.providerType === 'github' ? 'GitHub' : 'GitLab'
            showErrorToast(t('token_expired', { provider: label }))
        }

        window.addEventListener('git:token-expired', onExpired)
        return () => window.removeEventListener('git:token-expired', onExpired)
    }, [showErrorToast, t])
}
