import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, PlusCircle, GitBranch } from "lucide-react"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@renderer/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@renderer/components/ui/popover"
import { Button } from "@renderer/components/ui/button"
import { cn } from "@renderer/lib/utils"

interface Branch {
  name: string
  isActive: boolean
  isRemote: boolean
  fullName: string
  lastCommit?: string
  lastCommitDate?: string
}

interface BranchSwitcherProps {
  projectPath: string
  onError?: (message: string) => void
  onSuccess?: (message: string) => void
}

export function BranchSwitcher({ projectPath, onError, onSuccess }: BranchSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBranch, setSelectedBranch] = useState<string>("")
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  useEffect(() => {
    loadBranches()
  }, [projectPath])

  const loadBranches = async () => {
    try {
      const branchList = await window.electron.ipcRenderer.invoke('list-branches', projectPath)
      setBranches(branchList)
      
      // Set the initially selected branch to the active one
      const activeBranch = branchList.find(branch => branch.isActive)
      if (activeBranch) {
        setSelectedBranch(activeBranch.name)
      }
    } catch (error) {
      onError?.('Failed to load branches')
      console.error('Error loading branches:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBranch = async () => {
    try {
      setIsCreatingBranch(false);
      await window.electron.ipcRenderer.invoke('create-branch', {
        projectPath,
        branchName: newBranchName
      });
      
      // Reset and reload
      setNewBranchName('');
      await loadBranches();
      setOpen(false);
      onSuccess?.(`Branch "${newBranchName}" created successfully`);
    } catch (error: any) {
      onError?.(error.message || 'Failed to create branch');
    }
  };

  const handleBranchSwitch = async (branchName: string) => {
    try {
      await window.electron.ipcRenderer.invoke('checkout-branch', {
        projectPath,
        branchName
      })
      
      await loadBranches()
      setSelectedBranch(branchName)
      setOpen(false)
      onSuccess?.(`Switched to branch ${branchName}`)
    } catch (error) {
      if (error instanceof Error) {
        onError?.(error.message || 'Failed to switch branch');
        console.error('Error switching branch:', error);
      } else {
        onError?.('Failed to switch branch');
        console.error('Error switching branch:', error);
      }
    }
  }

  if (isLoading) {
    return (
      <Button variant="outline" className="w-[250px] justify-between" disabled>
        <GitBranch className="mr-2 h-4 w-4" />
        Loading branches...
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between"
        >
          <GitBranch className="mr-2 h-4 w-4" />
          {selectedBranch || "Select branch"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search branch..." />
          <CommandList>
            <CommandEmpty>No branch found.</CommandEmpty>
            <CommandGroup heading="Branches">
              {branches.map((branch) => (
                <CommandItem
                  key={branch.fullName}
                  onSelect={() => handleBranchSwitch(branch.name)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        branch.isActive ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="flex items-center gap-2">
                        {branch.name}
                        {branch.isActive && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            Current
                          </span>
                        )}
                        {branch.isRemote && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            Remote
                          </span>
                        )}
                      </span>
                      {branch.lastCommit && (
                        <span className="text-xs text-muted-foreground">
                          {branch.lastCommit} • {branch.lastCommitDate}
                        </span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
            <CommandItem
              onSelect={() => setIsCreatingBranch(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create new branch
            </CommandItem>

            {isCreatingBranch && (
              <div className="p-2 flex gap-2">
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Branch name..."
                  autoFocus
                />
                <Button 
                  size="sm"
                  disabled={!newBranchName.trim()}
                  onClick={handleCreateBranch}
                >
                  Create
                </Button>
              </div>
            )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}