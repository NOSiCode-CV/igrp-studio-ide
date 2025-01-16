
import { RefreshCw } from "lucide-react";

import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useGit } from "@renderer/hooks/useGit";
import { Button } from "../ui/button";
import { cn } from "@renderer/lib/utils";

const SyncButton = ({ basePath, activeBranch }: { basePath: string; activeBranch: string }) => {
  const { syncChanges } = useGit();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncChanges(basePath, activeBranch);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline" 
          size="sm"
          onClick={handleSync} 
          disabled={isSyncing}
        >
          <RefreshCw 
            className={cn(
              "h-4 w-4 mr-2",
              isSyncing && "animate-spin"
            )} 
          />
          {isSyncing ? 'Syncing...' : 'Sync Changes'}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Pull and push changes</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default SyncButton;