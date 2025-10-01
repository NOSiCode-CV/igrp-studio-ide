import { JSX } from 'react';
import { Bell, Check, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    IGRPButtonPrimitive,
    IGRPPopoverPrimitive,
    IGRPPopoverContentPrimitive,
    IGRPPopoverTriggerPrimitive,
    IGRPIcon,
} from '@igrp/igrp-framework-react-design-system';
import { cn } from '@renderer/lib/utils';

interface Notification {
    id: string;
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    type: 'info' | 'warning' | 'error' | 'success';
}

interface NotificationsPopoverProps {
    className?: string;
}

const NotificationsPopover = ({
    className,
}: NotificationsPopoverProps): JSX.Element => {
    const { t } = useTranslation();

    // Mock data - in real implementation, this would come from a state management system
    const notifications: Notification[] = [];
    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAllAsRead = (): void => {
        // In real implementation, this would dispatch an action to mark all notifications as read
        console.log('Mark all as read');
    };

    const getNotificationIcon = (type: Notification['type']): string => {
        switch (type) {
            case 'success':
                return 'CheckCircle';
            case 'warning':
                return 'AlertTriangle';
            case 'error':
                return 'XCircle';
            case 'info':
            default:
                return 'Info';
        }
    };

    const getNotificationColor = (type: Notification['type']): string => {
        switch (type) {
            case 'success':
                return 'text-green-600';
            case 'warning':
                return 'text-yellow-600';
            case 'error':
                return 'text-red-600';
            case 'info':
            default:
                return 'text-blue-600';
        }
    };

    return (
        <IGRPPopoverPrimitive>
            <IGRPPopoverTriggerPrimitive asChild>
                <IGRPButtonPrimitive
                    variant="ghost"
                    size="sm"
                    className={cn('relative', className)}
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                    <span className="sr-only">{t('notifications')}</span>
                </IGRPButtonPrimitive>
            </IGRPPopoverTriggerPrimitive>
            <IGRPPopoverContentPrimitive
                className="w-80 p-0"
                align="end"
                sideOffset={8}
            >
                <div className="flex items-center justify-between border-b p-4">
                    <h4 className="leading-none font-medium">
                        {t('notifications')}
                    </h4>

                    {notifications.length > 0 && (
                        <IGRPButtonPrimitive
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="text-sm"
                        >
                            <Check className="w-4 h-4 mr-1" />
                            {t('markAllAsRead')}
                        </IGRPButtonPrimitive>
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
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        'p-4 hover:bg-muted/50 transition-colors',
                                        !notification.read && 'bg-blue-50/50'
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <IGRPIcon
                                            iconName={getNotificationIcon(
                                                notification.type
                                            )}
                                            className={cn(
                                                'w-5 h-5 mt-0.5 flex-shrink-0',
                                                getNotificationColor(
                                                    notification.type
                                                )
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
                                                        {notification.timestamp.toLocaleTimeString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {!notification.read && (
                                                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                                    )}
                                                    <IGRPButtonPrimitive
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        <MoreHorizontal className="w-3 h-3" />
                                                    </IGRPButtonPrimitive>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {notifications.length > 0 && (
                    <div className="border-t p-3">
                        <IGRPButtonPrimitive
                            variant="ghost"
                            className="w-full text-sm"
                        >
                            {t('viewAllNotifications')}
                        </IGRPButtonPrimitive>
                    </div>
                )}
            </IGRPPopoverContentPrimitive>
        </IGRPPopoverPrimitive>
    );
};

export default NotificationsPopover;
