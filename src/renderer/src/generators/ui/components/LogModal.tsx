import { DialogDescription } from '@radix-ui/react-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@renderer/components/ui/dialog';
import { ScrollArea } from '@renderer/components/ui/scroll-area';

interface LogModalProps {
  logs: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const LogModal = ({ logs, isOpen, onOpenChange }: LogModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button className="hidden">Ver Logs</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Logs do Next.js</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <ScrollArea className="h-96 w-full rounded-md border p-4">
          <pre className="text-sm">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default LogModal;