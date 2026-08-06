import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type NotificationType = 'info' | 'warning' | 'error' | 'success'

export type NotificationActionType = 'update-igrp-cli'

export interface AppNotification {
    id: string
    title: string
    message: string
    /** Epoch ms — Redux-friendly (avoid Date instances). */
    timestamp: number
    read: boolean
    type: NotificationType
    action?: {
        type: NotificationActionType
        labelKey?: string
    }
    meta?: {
        installed?: string
        latest?: string
    }
}

export interface NotificationsState {
    items: AppNotification[]
}

const initialState: NotificationsState = {
    items: []
}

export const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        upsertNotification: (state, action: PayloadAction<AppNotification>) => {
            const index = state.items.findIndex((n) => n.id === action.payload.id)
            if (index >= 0) {
                state.items[index] = action.payload
            } else {
                state.items.unshift(action.payload)
            }
        },
        removeNotification: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter((n) => n.id !== action.payload)
        },
        markNotificationRead: (state, action: PayloadAction<string>) => {
            const item = state.items.find((n) => n.id === action.payload)
            if (item) item.read = true
        },
        markAllNotificationsRead: (state) => {
            for (const item of state.items) {
                item.read = true
            }
        },
        clearNotifications: (state) => {
            state.items = []
        }
    }
})

export const {
    upsertNotification,
    removeNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications
} = notificationsSlice.actions

export default notificationsSlice.reducer
