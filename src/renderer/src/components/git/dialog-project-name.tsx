import { useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { Button } from '../ui/button';

export const ProjectNameDialog = ({ isOpen, onClose, defaultName, onConfirm }) => {
    const [projectName, setProjectName] = useState(defaultName);
  
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Project Name</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Project name"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => onConfirm(projectName)}
              disabled={!projectName.trim()}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };