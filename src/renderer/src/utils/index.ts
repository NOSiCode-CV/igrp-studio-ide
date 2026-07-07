import { httpMethods, httpStatusCodes } from '@renderer/constants/appConstants'
import { formatDistanceToNow } from 'date-fns'
import { enUS, pt } from 'date-fns/locale'
import i18next from 'i18next'
import {
    Activity,
    Cable,
    Circle,
    Database,
    FileKey,
    FileText,
    type LucideIcon,
    TextQuote,
    Zap
} from 'lucide-react'

export function capitalize(str: string): string {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1)
}

export function filterItems(navData: any, searchQuery: string) {
    return searchQuery
        ? navData
              .map((item: any) => {
                  const matches =
                      item.isHeader || item.label.toLowerCase().includes(searchQuery.toLowerCase())

                  return matches ? { ...item } : null
              })
              .filter((item: any) => item !== null)
        : navData
}

export function filterSubItems(navData: any, searchQuery: string): any {
    if (!searchQuery) return navData
    return navData
        .map((item: any) => {
            const filteredSubItems = item?.subItems
                ? item.subItems.filter((subItem: any) =>
                      subItem.label.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                : []

            if (item.isHeader || filteredSubItems.length > 0) {
                return {
                    ...item,
                    subItems: filteredSubItems
                }
            }

            return null
        })
        .filter((item: any) => item !== null)
}

export function generateRowId() {
    // Generate a random string with 8 characters
    const randomStr = Math.random().toString(36).substring(2, 8)
    return `row-${randomStr}`
}

export function getId() {
    return Math.random().toString(36).slice(2, 12)
}

export function getUUID() {
    return crypto.randomUUID()
}

export function generateId(componentName: string) {
    // Generate a random string with 8 characters
    const randomStr = Math.random().toString(36).slice(2, 8)
    // Defensive: never crash the whole component init if a caller passes an
    // undefined/empty name (e.g. an unknown COMPONENT.* key).
    const base = (componentName || 'component').toLowerCase()
    return `${base}_${randomStr}`
}

export function findComponentItem(menus: Array<any>, idFind: string) {
    return (
        menus.flatMap((menu: any) => menu.subItems || []).find((sub: any) => sub.id === idFind) ||
        null
    )
}

export const getBadgeColor = (method: string): string | undefined => {
    return httpMethods.find((item: any) => item.value === method)?.color
}

export const getStatusLabel = (statusCode: string): string => {
    const status = httpStatusCodes.find((status) => status.value === statusCode)
    return status ? status.label.replace(`${status.value} `, '') : `Error (${statusCode})`
}

export const toInitCap = (text: string) =>
    text.replace(/(?:^|\s|-)\S/g, (match) => match.toUpperCase())

export const getIcon = (folderName: string): LucideIcon => {
    if (!folderName || typeof folderName !== 'string') return Circle

    switch (folderName.toLowerCase()) {
        case 'controllers':
            return Activity
        case 'graphql':
            return Cable
        case 'models':
            return Database
        case 'dto':
            return FileText
        case 'action':
            return Zap
        case 'responses':
            return TextQuote
        case 'permissions':
            return FileKey
        default:
            return Circle
    }
}

export function toFullCamelCaseFromSnakeCase(str: string) {
    if (!str) return ''

    return capitalize(
        str
            .toLowerCase()
            .split('_')
            .map((word, index) =>
                index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
            )
            .join('')
    )
}

// Mirrors the engine's `getLabel` export (nextjs-engine ≥0.2.0-beta.22) —
// same heuristic, kept as a local copy because the engine bundle is
// Node-only (fs-extra/prettier at module top-level) and can't be imported
// by the renderer. If the engine changes its heuristic, sync this.
export function getLabel(name: string): string {
    if (!name) return '' // Handle empty string

    // Split on hyphens or uppercase letters
    const parts = name
        .replace(/([A-Z])/g, ' $1') // Add a space before uppercase letters
        .split(/[- ]+/) // Split on hyphens or spaces

    // Capitalize the first letter of each part and join with spaces
    return parts
        .filter((part) => part.length > 0) // Remove empty parts
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ')
}

export const getLocale = () => {
    switch (i18next.language) {
        case 'pt':
            return pt
        default:
            return enUS
    }
}

// Formats a filesystem timestamp (ms) as relative time ("2 days ago").
// Returns '-' when missing or epoch 0 (birthtime unavailable on some Linux filesystems).
export function formatFileDate(timestamp?: number): string {
    if (!timestamp) return '-'
    return formatDistanceToNow(timestamp, { addSuffix: true, locale: getLocale() })
}

/**
 * Lightweight camelCase implementation — replaces lodash-es#camelCase for the
 * limited usage we have (page/component names). Splits on non-alphanumerics
 * and on lower-to-upper boundaries, then joins as `firstWordLower + Pascal`.
 *
 * Examples:
 *   camelCase('hello world')   -> 'helloWorld'
 *   camelCase('my-page-name')  -> 'myPageName'
 *   camelCase('My_File.Name')  -> 'myFileName'
 *   camelCase('XMLHttpRequest')-> 'xmlHttpRequest'
 */
export function camelCase(input: string): string {
    if (!input) return ''
    const words = String(input)
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .split(/[^a-zA-Z0-9]+/)
        .filter(Boolean)
    if (words.length === 0) return ''
    return words
        .map((w, i) =>
            i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        )
        .join('')
}
