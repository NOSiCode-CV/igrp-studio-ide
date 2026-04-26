import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useToast from './useToast'

interface TokenExpiredDetail {
    providerType: 'github' | 'gitlab'
    status: number
}

interface RateLimitedDetail {
    providerType: 'github' | 'gitlab'
}

/**
 * Surfaces toasts when any git provider reports an expired token or a
 * rate-limit hit. Mount once near the application root (e.g. inside the
 * layout) — the underlying CustomEvents are dispatched by the
 * useGitAuth hook so this stays decoupled from how many useGitAuth
 * instances exist.
 */
export function useGitTokenExpiredToast(): void {
    const { t } = useTranslation()
    const { showErrorToast } = useToast()

    useEffect(() => {
        const labelFor = (type: 'github' | 'gitlab'): string =>
            type === 'github' ? 'GitHub' : 'GitLab'

        const onExpired = (event: Event): void => {
            const detail = (event as CustomEvent<TokenExpiredDetail>).detail
            showErrorToast(t('token_expired', { provider: labelFor(detail.providerType) }))
        }

        const onRateLimited = (event: Event): void => {
            const detail = (event as CustomEvent<RateLimitedDetail>).detail
            showErrorToast(t('rate_limited', { provider: labelFor(detail.providerType) }))
        }

        window.addEventListener('git:token-expired', onExpired)
        window.addEventListener('git:rate-limited', onRateLimited)
        return () => {
            window.removeEventListener('git:token-expired', onExpired)
            window.removeEventListener('git:rate-limited', onRateLimited)
        }
    }, [showErrorToast, t])
}
