import {
    setActiveProvider,
    setProviderRepositories,
    setProviderUser
} from '@renderer/redux/git/reducer'
import { selectActiveProviderId } from '@renderer/redux/git/selectors'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import useToast from './useToast'

interface TokenExpiredPayload {
    providerType: 'github' | 'gitlab'
    status: number
}

interface RateLimitedPayload {
    providerType: 'github' | 'gitlab'
}

const DEDUPE_WINDOW_MS = 5_000

/**
 * Single owner of the git-* IPC error broadcasts.
 *
 * Mount once near the application root (MainLayout) so:
 *  - a renderer-side dedupe window collapses bursts of token-expired /
 *    rate-limited events fired by main when several IPC calls (user
 *    info + repositories, etc.) happen back-to-back;
 *  - the toast surfaces exactly once per provider per burst;
 *  - Redux cleanup runs once.
 *
 * Previously this hook only owned the toast and useGitAuth forwarded
 * IPC events through a window CustomEvent. Each useGitAuth instance
 * dispatched the same event so consumers saw N toasts.
 */
export function useGitTokenExpiredToast(): void {
    const { t } = useTranslation()
    const { showErrorToast } = useToast()
    const dispatch = useDispatch()
    const activeProviderId = useSelector(selectActiveProviderId)
    const lastFiredRef = useRef<Map<string, number>>(new Map())

    useEffect(() => {
        const labelFor = (type: 'github' | 'gitlab'): string =>
            type === 'github' ? 'GitHub' : 'GitLab'

        const shouldFire = (key: string): boolean => {
            const now = Date.now()
            const last = lastFiredRef.current.get(key) ?? 0
            if (now - last < DEDUPE_WINDOW_MS) return false
            lastFiredRef.current.set(key, now)
            return true
        }

        const onTokenExpired = (_event: any, payload: TokenExpiredPayload): void => {
            if (!payload?.providerType) return
            if (!shouldFire(`expired:${payload.providerType}`)) return

            const { providerType } = payload
            if (providerType === 'github') {
                dispatch(setProviderUser({ providerId: 'github', user: null }))
                dispatch(setProviderRepositories({ providerId: 'github', repositories: [] }))
            } else if (activeProviderId && activeProviderId !== 'github') {
                dispatch(setProviderUser({ providerId: activeProviderId, user: null }))
                dispatch(
                    setProviderRepositories({
                        providerId: activeProviderId,
                        repositories: []
                    })
                )
            }
            dispatch(setActiveProvider(null))

            showErrorToast(t('token_expired', { provider: labelFor(providerType) }))
        }

        const onRateLimited = (_event: any, payload: RateLimitedPayload): void => {
            if (!payload?.providerType) return
            if (!shouldFire(`rate:${payload.providerType}`)) return

            showErrorToast(t('rate_limited', { provider: labelFor(payload.providerType) }))
        }

        window.electron.ipcRenderer.on('git-token-expired', onTokenExpired)
        window.electron.ipcRenderer.on('git-rate-limited', onRateLimited)

        return () => {
            window.electron.ipcRenderer.removeListener('git-token-expired', onTokenExpired)
            window.electron.ipcRenderer.removeListener('git-rate-limited', onRateLimited)
        }
    }, [activeProviderId, dispatch, showErrorToast, t])
}
