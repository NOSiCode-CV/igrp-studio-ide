import type { RootState } from '@renderer/redux'
import { createSelector } from '@reduxjs/toolkit'

const selectNotificationsState = (state: RootState) => state.notifications

export const selectNotifications = createSelector(
    selectNotificationsState,
    (notifications) => notifications.items
)

export const selectUnreadNotificationCount = createSelector(
    selectNotifications,
    (items) => items.filter((n) => !n.read).length
)
