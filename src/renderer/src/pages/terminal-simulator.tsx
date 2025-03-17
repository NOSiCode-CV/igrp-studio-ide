"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { TerminalIcon, X, Minimize, Copy } from "lucide-react"
import { Button } from "@renderer/components/ui/button"
import { ScrollArea } from "@renderer/components/ui/scroll-area"
import { useSidebar } from "@renderer/components/ui/sidebar"

interface TerminalSimulatorProps {
  isOpen: boolean
  onClose: () => void
  onMinimizeChange?: (minimized: boolean) => void
}

export function TerminalSimulator({ isOpen, onClose, onMinimizeChange }: TerminalSimulatorProps) {
  //const { state } = useSidebar()
  const state ='expanded'
  const [history, setHistory] = useState<Array<{ type: "input" | "output"; content: string }>>([
    { type: "output", content: "Welcome to Terminal Simulator v1.0.0" },
    { type: "output", content: "Type 'help' to see available commands." },
  ])
  const [input, setInput] = useState("")
  const [minimized, setMinimized] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Focus input when terminal opens
  useEffect(() => {
    if (isOpen && !minimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, minimized])

  // Scroll to bottom when history changes
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [history])

  // Notify parent component when minimized state changes
  useEffect(() => {
    onMinimizeChange?.(minimized)
  }, [minimized, onMinimizeChange])

  // Reset minimized state when terminal is closed
  useEffect(() => {
    if (!isOpen && minimized) {
      setMinimized(false)
    }
  }, [isOpen, minimized])

  const handleCommand = (cmd: string) => {
    // Add command to history
    setHistory((prev) => [...prev, { type: "input", content: cmd }])

    // Process command
    let output = ""
    const command = cmd.trim().toLowerCase()
    const args = command.split(" ")

    switch (args[0]) {
      case "help":
        output = `
Available commands:
  help - Show this help message
  clear - Clear the terminal
  echo [text] - Echo text back to the terminal
  date - Show current date and time
  ls - List files (simulated)
  whoami - Show current user
  exit - Close the terminal
`
        break
      case "clear":
        setHistory([])
        return
      case "echo":
        output = args.slice(1).join(" ")
        break
      case "date":
        output = new Date().toString()
        break
      case "ls":
        output = `
Desktop
Documents
Downloads
Pictures
Projects
  README.md
  package.json
  node_modules/
`
        break
      case "whoami":
        output = "user@desktop-simulator"
        break
      case "exit":
        handleClose()
        return
      default:
        output = `Command not found: ${command}. Type 'help' for available commands.`
    }

    // Add output to history
    setHistory((prev) => [...prev, { type: "output", content: output }])
    setInput("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      handleCommand(input)
    }
  }

  const toggleMinimize = () => {
    setMinimized(!minimized)
  }

  // Centralized close handler to ensure minimized state is reset
  const handleClose = () => {
    setMinimized(false) // Reset minimized state
    onClose() // Call the parent's onClose handler
  }

  // If minimized or not open, don't render the terminal
  if (!isOpen || minimized) return null

  // Determine the left position based on sidebar state
  const sidebarWidth = state === "expanded" ? "var(--sidebar-width, 16rem)" : "var(--sidebar-width-icon, 3rem)"

  return (
    <div
      className="fixed bottom-0 right-0 z-[100] h-[60vh] transition-all duration-200 ease-in-out"
      style={{
        left: sidebarWidth,
      }}
    >
      <div className="absolute bottom-0 left-0 right-0 h-full bg-black rounded-t-lg overflow-hidden border border-gray-800 shadow-2xl">
        {/* Terminal header */}
        <div className="flex items-center justify-between h-9 px-3 bg-gray-900">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <button className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600" onClick={handleClose}></button>
              <button
                className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600"
                onClick={toggleMinimize}
              ></button>
              <button className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600"></button>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <TerminalIcon className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Terminal</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-gray-300"
              onClick={() => {
                navigator.clipboard.writeText(
                  history.map((item) => (item.type === "input" ? `$ ${item.content}` : item.content)).join("\n"),
                )
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-gray-300"
              onClick={toggleMinimize}
            >
              <Minimize className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-gray-300"
              onClick={handleClose}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Terminal content */}
        <div className="h-[calc(100%-36px)] flex flex-col">
          <ScrollArea className="flex-1 p-3 font-mono text-sm text-green-400 bg-black" ref={scrollAreaRef}>
            {history.map((item, index) => (
              <div key={index} className="mb-1">
                {item.type === "input" ? (
                  <div className="flex">
                    <span className="text-green-500 mr-2">$</span>
                    <span>{item.content}</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{item.content}</div>
                )}
              </div>
            ))}
          </ScrollArea>

          <form onSubmit={handleSubmit} className="flex items-center px-3 py-2 bg-black border-t border-gray-800">
            <span className="text-green-500 mr-2">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono text-sm"
              autoComplete="off"
              spellCheck="false"
            />
          </form>
        </div>
      </div>
    </div>
  )
}

