import { useState, useEffect } from 'react'
import MonacoEditor from '@renderer/components/monaco-editor'

const CodeContentJson = ({ components, pagePath }: any) => {
  const code = components ? JSON.stringify(components, null, 2) : '// No components data available'
  return (
    <div className="h-full">
      <div className="p-2 bg-gray-100 border-b">
        <span className="text-sm text-gray-600">JSON Configuration</span>
      </div>
      <MonacoEditor
        language="json"
        content={code}
        filePath={pagePath}
        height="calc(100vh - 120px)"
      />
    </div>
  )
}

const CodeContentTS = ({ pagePath }: { pagePath: string }) => {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true)
        const fileContent = await window.api.readProjectFile(pagePath)

        if (fileContent && fileContent.trim()) {
          setContent(fileContent)
        } else {
          setContent(`// File not found or empty
// This file will be generated when you save the page

// Expected path: ${pagePath}

// To generate this file:
// 1. Make sure you have components in the design view
// 2. Click the save button to generate the TypeScript code
// 3. The file will be created at the path above`)
        }
      } catch (error) {
        console.error('Error loading TypeScript content:', error)
        setContent(`// File not found - This is expected if you haven't saved yet
// This file will be generated when you save the page

// Expected path: ${pagePath}

// To generate this file:
// 1. Make sure you have components in the design view
// 2. Click the save button to generate the TypeScript code
// 3. The file will be created at the path above`)
      } finally {
        setLoading(false)
      }
    }

    if (pagePath) {
      loadContent()
    }
  }, [pagePath])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p>Loading TypeScript content...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <div className="p-2 bg-gray-100 border-b">
        <span className="text-sm text-gray-600">TypeScript Generated Code</span>
        <span className="text-xs text-gray-400 ml-2">{pagePath}</span>
      </div>
      <MonacoEditor
        language="typescript"
        content={content}
        filePath={pagePath}
        height="calc(100vh - 120px)"
      />
    </div>
  )
}

export { CodeContentJson, CodeContentTS }
