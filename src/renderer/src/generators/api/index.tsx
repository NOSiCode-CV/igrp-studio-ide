import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@renderer/routes/routeConstants'
import TabManager, { TabItem } from '@renderer/components/TabManager'
import { PAGE_DEFAULT } from '@renderer/constants/appConstants'

interface PageBuilderProps {
  basePath?: string
}

const Index = ({ basePath }: PageBuilderProps) => {
  const [tabs, setTabs] = useState<Array<TabItem>>([
    { id: 'tab-0', title: PAGE_DEFAULT, open: 'none' }
  ])
  const [activeTab, setActiveTab] = useState('tab-0')
  const navigate = useNavigate()

  // Add a new tab or activate an existing one
  const handleNewTab = (tab: TabItem) => {
    setTabs(
      (prevTabs) =>
        prevTabs.some((t) => t.id === tab.id)
          ? prevTabs.map((t) => (t.id === tab.id ? { ...t, ...tab } : t)) // Update the existing tab
          : [...prevTabs, tab] // Add new tab if it doesn't exist
    )
    setActiveTab(tab.id)
  }

  // Close an existing tab and adjust activeTab
  const handleCloseTab = (tabId: string) => {
    setTabs((prevTabs) => {
      const updatedTabs = prevTabs.filter((t) => t.id !== tabId)
      if (activeTab === tabId) {
        const newActiveTab =
          updatedTabs.length > 0 ? updatedTabs[updatedTabs.length - 1].id : PAGE_DEFAULT
        setActiveTab(newActiveTab)
      }
      return updatedTabs
    })
  }

  // Navigate to the home route if basePath is empty or undefined
  useEffect(() => {
    if (!basePath) {
      navigate(ROUTES.HOME)
    }
  }, [basePath, navigate])

  return (
    <TabManager
      basePath={basePath}
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      setNewTab={handleNewTab}
      onCloseTab={handleCloseTab}
    />
  )
}

export default Index
