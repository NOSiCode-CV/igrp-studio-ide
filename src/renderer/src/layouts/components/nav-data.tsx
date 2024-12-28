import { useDispatch } from 'react-redux'
import { setCurrentItem as onSetCurrentItem } from '@renderer/redux/thunks'
import { createMenuHeader, getBadgeColor } from '@renderer/utils/helpers'
import { MenuItem } from 'src/main/types'
import { Boxes } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { OPTION_TYPE } from '@renderer/constants/appConstants'

const Navdata = (folders: any) => {
  const dispatch: any = useDispatch()

  const menuItems: MenuItem[] = []

  const { t } = useTranslation()

  const onClickItem = (subItem: any) => {
    dispatch(onSetCurrentItem(subItem))
  }

  Object.keys(folders).forEach((folderName: string) => {
    const folderMenuItem: MenuItem = {
      icon: Boxes,
      label: folderName,
      subItems: [],
      isHeader: true,
      dropdownclick: function (item) {
        onClickItem(item)
      },
      dropdownMenus: [
        {
          label: t(`newDto`),
          type: 'dto'
        },
        {
          label: t('newModels'),
          type: 'models'
        },
        {
          label: t('newControllers'),
          type: 'controllers'
        }
      ]
    }

    // Process each folder's content
    folders[folderName].files.forEach((folder) => {
      // Iterate through the categories (e.g., "dto", "controller") within the folder
      Object.keys(folder).forEach((categoryName: string) => {
        // Create a category menu item
        const categoryMenuItem: MenuItem = createMenuHeader(categoryName, categoryName)

        // Add each file in the category as a sub-item
        categoryMenuItem.subItems = folder[categoryName].map(
          (file: { name: string; path: string; content: any }) => ({
            label: file.name,
            path: file.path,
            module: folderName,
            type: categoryName,
            subItems: getSubItems(categoryName, file, file.path,folderName, onClickItem),
            click: (subItem) => onClickItem(subItem)
          })
        )

        // Add the category menu item to the folder's sub-items
        folderMenuItem.subItems!.push(categoryMenuItem)
      })
    })

    // Add the folder's menu item to the main menu items
    menuItems.push(folderMenuItem)
  })

  return { menuItems }
}

function getSubItems(
  categoryName: string,
  file: any,
  path: string,
  folderName: string,
  onClickItem: (subItem: any) => void
) {
  const actions = file?.content?.actions
  if (categoryName === OPTION_TYPE.CONTROLLERS && actions) {
    return actions.map((action) => ({
      id: action.actionName,
      label: action.actionName,
      path: path,
      type: OPTION_TYPE.CONTROLLERS,
      sutType: OPTION_TYPE.ACTION,
      click: (subItem) => onClickItem(subItem),
      badgeColor: getBadgeColor(action.method),
      badgeName: action.method,
      content: action,
      module: folderName
    }))
  }
  return []
}

export default Navdata
