
import { useGit } from "@renderer/hooks/useGit";
import { GitPullRequestArrow, GitCompare, GitBranchPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "../ui/badge";

export const GitChangesCount = ({ basePath }: { basePath: string }) => {
  const { getChangesCount } = useGit();
  const [counts, setCounts] = useState({ ahead: 0, behind: 0, modified: 0 });

  useEffect(() => {
    const loadCounts = async () => {
      const result = await getChangesCount(basePath);
      setCounts(result);
    };
    
    loadCounts();
  }, []);

  return (
    <div className="w-fit">
      <div className="flex">
        {counts.behind > 0 && (
          <Badge variant="secondary" className="flex items-center gap-2">
            <GitPullRequestArrow className="h-4 w-4" />
            <span>Pull: {counts.behind}</span>
          </Badge>
        )}
        
        {counts.ahead > 0 && (
          <Badge variant="secondary" className="flex items-center gap-2">
            <GitBranchPlus className="h-4 w-4" />
            <span>Push: {counts.ahead}</span>
          </Badge>
        )}
        
        {counts.modified > 0 && (
          <Badge variant="outline" className="flex items-center gap-2">
            <GitCompare className="h-4 w-4" />
            <span>Modified: {counts.modified}</span>
          </Badge>
        )}
      </div>
    </div>
  );
};