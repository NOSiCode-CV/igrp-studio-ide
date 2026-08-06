import { Button } from '@renderer/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { IGRPIcon } from '@igrp/igrp-framework-react-design-system'
import {
    CLI_UPDATE_NOTIFICATION_ID,
    clearCliUpdateDismiss,
    dismissCliUpdate
} from '@renderer/hooks/useIgrpCliUpdateCheck'
import useToast from '@renderer/hooks/useToast'
import { installIgrpCli } from '@renderer/services/igrp-cli'
import { cn } from '@renderer/lib/utils'
import {
    markAllNotificationsRead,
    markNotificationRead,
    removeNotification,
    type AppNotification,
    type NotificationType
} from '@renderer/redux/notifications/reducer'
import {
    selectNotifications,
    selectUnreadNotificationCount
} from '@renderer/redux/notifications/selectors'
import { Bell, Check, Download, Loader2, X } from 'lucide-react'
import { type JSX, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

interface NotificationsPopoverProps {
    className?: string
    triggerClassName?: string
}

const NotificationsPopover = ({
    className,
    triggerClassName
}: NotificationsPopoverProps): JSX.Element => {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const { showSuccessToast, showErrorToast } = useToast()
    const notifications = useSelector(selectNotifications)
    const unreadCount = useSelector(selectUnreadNotificationCount)
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    const markAllAsRead = (): void => {
        dispatch(markAllNotificationsRead())
    }

    const getNotificationIcon = (type: NotificationType): string => {
        switch (type) {
            case 'success':
                return 'CircleCheck'
            case 'warning':
                return 'TriangleAlert'
            case 'error':
                return 'CircleX'
            case 'info':
            default:
                return 'Info'
        }
    }

    const getNotificationColor = (type: NotificationType): string => {
        switch (type) {
            case 'success':
                return 'text-green-600'
            case 'warning':
                return 'text-yellow-600'
            case 'error':
                return 'text-red-600'
            case 'info':
            default:
                return 'text-blue-600'
        }
    }

    const dismissNotification = (notification: AppNotification): void => {
        if (notification.id === CLI_UPDATE_NOTIFICATION_ID && notification.meta?.latest) {
            dismissCliUpdate(notification.meta.latest)
        }
        dispatch(removeNotification(notification.id))
    }

    const handleUpdateCli = async (notification: AppNotification): Promise<void> => {
        setUpdatingId(notification.id)
        dispatch(markNotificationRead(notification.id))
        try {
            // Reuses the same install path as onboarding (`installIgrpCli` IPC).
            const result = await installIgrpCli(notification.meta?.latest)
            if (!result.success) {
                showErrorToast(result.error || t('cliUpdateFailed'))
                return
            }
            clearCliUpdateDismiss()
            dispatch(removeNotification(notification.id))
            showSuccessToast(
                t('cliUpdateSuccess', {
                    version: notification.meta?.latest ?? ''
                })
            )
        } catch (error) {
            showErrorToast(error instanceof Error ? error.message : t('cliUpdateFailed'))
        } finally {
            setUpdatingId(null)
        }
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn('relative', triggerClassName, className)}
                >
                    <Bell className="h-3.5 w-3.5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-[#0A0D14] animate-pulse" />
                    )}
                    <span className="sr-only">{t('notifications')}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
                <div className="flex items-center justify-between border-b p-4">
                    <h4 className="leading-none font-medium">{t('notifications')}</h4>

                    {notifications.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="text-sm"
                        >
                            <Check className="w-4 h-4 mr-1" />
                            {t('markAllAsRead')}
                        </Button>
                    )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                            <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">
                                {t('noNotifications')}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                {t('noNotificationsDescription')}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => {
                                const isUpdating = updatingId === notification.id
                                return (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            'p-4 hover:bg-muted/50 transition-colors',
                                            !notification.read &&
                                                'bg-blue-50/50 dark:bg-blue-950/20'
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <IGRPIcon
                                                iconName={getNotificationIcon(notification.type)}
                                                className={cn(
                                                    'w-5 h-5 mt-0.5 flex-shrink-0',
                                                    getNotificationColor(notification.type)
                                                )}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <h5 className="text-sm font-medium text-foreground">
                                                            {notification.title}
                                                        </h5>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            {new Date(
                                                                notification.timestamp
                                                            ).toLocaleTimeString()}
                                                        </p>
                                                        {notification.action?.type ===
                                                            'update-igrp-cli' && (
                                                            <div className="mt-3 flex items-center gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-7 text-xs"
                                                                    disabled={isUpdating}
                                                                    onClick={() =>
                                                                        void handleUpdateCli(
                                                                            notification
                                                                        )
                                                                    }
                                                                >
                                                                    {isUpdating ? (
                                                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                                    ) : (
                                                                        <Download className="w-3 h-3 mr-1" />
                                                                    )}
                                                                    {isUpdating
                                                                        ? t('cliUpdating')
                                                                        : t(
                                                                              notification.action
                                                                                  .labelKey ||
                                                                                  'cliUpdateAction'
                                                                          )}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-7 text-xs"
                                                                    disabled={isUpdating}
                                                                    onClick={() =>
                                                                        dismissNotification(
                                                                            notification
                                                                        )
                                                                    }
                                                                >
                                                                    {t('dismiss')}
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {!notification.read && (
                                                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            title={t('dismiss')}
                                                            onClick={() =>
                                                                dismissNotification(notification)
                                                            }
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default NotificationsPopover
