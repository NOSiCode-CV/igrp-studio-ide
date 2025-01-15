export const ProjectConfigSummary = ({ values }: { values: any }) => {
    return (
        <div className="space-y-2">
            <h3 className="font-medium">Project Configuration</h3>
            <div className="text-sm space-y-1">
                <p>
                    <span className="text-muted-foreground">Type:</span>
                    {values.type}
                </p>
                <p>
                    <span className="text-muted-foreground">Framework:</span>
                    {values.framework}
                </p>
                {values.framework === 'spring' && values.Config && (
                    <>
                        <p>
                            <span className="text-muted-foreground">
                                Database:
                            </span>
                            {values.Config.database}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                                Structure:
                            </span>
                            {values.Config.structureStyle}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                                Group:
                            </span>
                            {values.Config.group}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                                Artifact:
                            </span>
                            {values.Config.artifact}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                                Core Version:
                            </span>
                            {values.Config.coreVersion}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                                Observability:
                            </span>
                            {values.Config.enableObservability
                                ? 'Enabled'
                                : 'Disabled'}
                        </p>
                    </>
                )}
                {values.framework === 'nextjs' && values.Config && (
                    <>
                        <p>
                            <span className="text-muted-foreground">
                                TypeScript:
                            </span>
                            {values.Config.typescript ? 'Yes' : 'No'}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                                Tailwind CSS:
                            </span>
                            {values.Config.tailwind ? 'Yes' : 'No'}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                                src/ Directory:
                            </span>
                            {values.Config.srcDirectory ? 'Yes' : 'No'}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                                Package Manager:
                            </span>
                            {values.Config.packageManager}
                        </p>
                    </>
                )}
                {values.framework === 'dotnet' && values.Config && (
                    <>
                        <p>
                            <span className="text-muted-foreground">
                                Project Name:
                            </span>
                            {values.Configformik.projectName}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                                Solution Name:
                            </span>
                            {values.Configformik.solutionName}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                                Framework:
                            </span>
                            {values.Configformik.framework}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                                Language:
                            </span>
                            {values.Configformik.language}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                                Authentication:
                            </span>
                            {values.Config.auth ? 'Yes' : 'No'}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                                HTTPS:
                            </span>
                            {values.Config.https ? 'Yes' : 'No'}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                                Docker Support:
                            </span>
                            {values.Config.dockerSupport ? 'Yes' : 'No'}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};
