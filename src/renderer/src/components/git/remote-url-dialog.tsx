
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "../ui/dialog";
  import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
  
  interface RemoteUrlDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (url: string) => void;
  }
  
  export function RemoteUrlDialog({ isOpen, onClose, onConfirm }: RemoteUrlDialogProps) {
    const [url, setUrl] = useState("");
  
    const handleConfirm = () => {
      onConfirm(url);
      setUrl("");
      onClose();
    };
  
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Remote Repository</DialogTitle>
            <DialogDescription>
              Enter the URL of your remote Git repository to enable synchronization.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="https://github.com/username/repository.git"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!url.trim()}>
              Add Remote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }