import { FolderFiles, MenuItem } from 'src/main/types'
import { faker } from '@faker-js/faker'
import { ROUTES } from '@renderer/routes/routeConstants'
import { Command, Database, Folder, Puzzle } from 'lucide-react'

// Function to convert folders into menuItems
export function generateMenuItems(folders: FolderFiles): MenuItem[] {
  const menuItems: MenuItem[] = []
  /*  menuItems.push({
        label: "MENU",
        isHeader: true
    }); */

  const items = Object.keys(folders).reduce((acc: MenuItem[], folderName: string) => {
    const itemName = capitalize(folderName)

    const item = createMenuHeader(itemName, folderName)

    const folderItems = createSubMenuItems(folders[folderName], folderName)

    item.subItems = folderItems

    return acc.concat(item)
  }, [])

  return menuItems.concat(items)
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function createMenuHeader(label: string, folderName?: string): MenuItem {
  const icon = folderName
    ? (() => {
        switch (folderName.toLowerCase()) {
          case 'controllers':
            return Command
          case 'models':
            return Database
          case 'dto':
            return Puzzle
          default:
            return Folder // Default icon for other folders
        }
      })()
    : ''

  return {
    label,
    id: folderName ? capitalize(folderName) : undefined,
    icon,
    link: ROUTES.PATH_PAGE_BUILDER_API,
    type: folderName || undefined,
    isHeader: false
  }
}

function createSubMenuItems(files: any, folderName: string): MenuItem[] {
  return files.map((file) => ({
    id: file.name,
    label: file.name,
    link: ROUTES.PATH_PAGE_BUILDER_API,
    path: file.path,
    type: folderName,
    icon: 'ri-subtract-line'
  }))
}

export function filterItems(navData: any, searchQuery: string) {
  return searchQuery
    ? navData
        .map((item) => {
          const matches =
            item.isHeader || item.label.toLowerCase().includes(searchQuery.toLowerCase())

          return matches ? { ...item } : null
        })
        .filter((item) => item !== null)
    : navData
}

export function filterSubItems(navData: any, searchQuery: string) {
  return navData
    .map((item) => {
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
    .filter((item) => item !== null)
}

export function generateRowId() {
  // Generate a random string with 8 characters
  const randomStr = Math.random().toString(36).substr(2, 8)
  return `row-${randomStr}`
}

export function generateId(componentName: string) {
  // Generate a random string with 8 characters
  const randomStr = Math.random().toString(36).slice(2, 8)
  return `${componentName.toLowerCase()}_${randomStr}`
}

export function findComponentItem(menus: Array<any>, idFind: string) {
  return menus.flatMap((menu) => menu.subItems || []).find((sub) => sub.id === idFind) || null
}

export const generateFakeDataForField = (field: any) => {
  switch (field.config.type) {
    case 'text':
      return faker.lorem.words(3)
    case 'number':
      return faker.number.int({ min: 1, max: 100 })
    case 'date':
      return faker.date.past().toLocaleDateString() // or use any other date format
    case 'boolean':
      return faker.datatype.boolean()
    case 'email':
      return faker.internet.email()
    // Add more cases for different field types as needed
    default:
      return faker.lorem.words(3) // Fallback to text if type is unknown
  }
}
