import { Badge } from '@renderer/components/ui/badge';

interface DependencyConfig {
    condition?: string;
}

interface DependencyProps {
    dependsOn?: Array<string | Record<string, DependencyConfig>>;
    isTable?: boolean;
}

const Dependency = ({ dependsOn, isTable = false }: DependencyProps) => {
    if (!dependsOn || dependsOn.length === 0) return null;

    const content = (
        <>
            {dependsOn.flatMap((dependency, i) => {
                // Handle string dependencies
                if (typeof dependency === 'string') {
                    return (
                        <Badge
                            key={`${dependency}-${i}`}
                            variant="outline"
                            className="text-xs truncate"
                        >
                            {dependency}
                        </Badge>
                    );
                }

                // Handle object dependencies
                return Object.entries(dependency).map(([depId, _config]) => (
                    <Badge
                        key={`${depId}-${i}`}
                        variant="outline"
                        className="text-xs truncate"
                    >
                      {depId}
                     {/*  {config?.condition ? ` (${config.condition})` : ''} */}
                    </Badge>
                ));
            })}
        </>
    );

    return (
        <>
            {isTable ? (
                <div className="flex flex-wrap gap-1"> {content}</div>
            ) : (
                <div className="py-1">
                    <div className="text-xs text-muted-foreground">
                        Depends on
                    </div>
                    <div className="text-xs font-mono flex flex-wrap gap-1 mt-0.5">
                        {content}
                    </div>
                </div>
            )}
        </>
    );
};

export default Dependency;
