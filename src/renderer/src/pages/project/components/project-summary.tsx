import { useTranslation } from 'react-i18next';
export const ProjectConfigSummary = ({ values }: { values: any }) => {
    const { t } = useTranslation();
    return (
        <div className="space-y-2">
            <h3 className="font-medium">{t('projectConfiguration')}</h3>
            <div className="text-sm space-y-1">
                <p>
                    <span className="text-muted-foreground">{t('type')}</span>
                    {values.type}
                </p>
                <p>
                    <span className="text-muted-foreground">{t('framework')}</span>
                    {values.framework}
                </p>
                {values.framework === 'springboot' && values.config && (
                    <>
                        <p>
                            <span className="text-muted-foreground">
                            {t('database')}
                            </span>
                            {values.config.database}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                            {t('structure')}
                            </span>
                            {values.config.structureStyle}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                            {t('group')}
                            </span>
                            {values.config.group}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                            {t('artifact')}
                            </span>
                            {values.config.artifact}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                            {t('coreVersion')}
                            </span>
                            {values.config.coreVersion}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                            {t('observability')}
                            </span>
                            {values.config.enableObservability
                                ? t('enabled')
                                : t('disabled')}
                        </p>
                    </>
                )}
                {values.framework === 'nextjs' && values.config && (
                    <>
                        <p>
                            <span className="text-muted-foreground">
                            {t('typescript')}
                            </span>
                            {values.Config.typescript ? 'Yes' : 'No'}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                            {t('tailwindCss')}
                            </span>
                            {values.Config.tailwind ? 'Yes' : 'No'}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                            {t('srcDirectory')}
                            </span>
                            {values.Config.srcDirectory ? 'Yes' : 'No'}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                            {t('packageManager')}
                            </span>
                            {values.Config.packageManager}
                        </p>
                    </>
                )}
                {values.framework === 'dotnet' && values.Config && (
                    <>
                        <p>
                            <span className="text-muted-foreground">
                            {t('projectName')}
                            </span>
                            {values.Configformik.projectName}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                            {t('solutionName')}
                            </span>
                            {values.Configformik.solutionName}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                            {t('framework')}
                            </span>
                            {values.Configformik.framework}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                            {t('language')}
                            </span>
                            {values.Configformik.language}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                            {t('authentication')}
                            </span>
                            {values.Config.auth ? 'Yes' : 'No'}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                            {t('https')}
                            </span>
                            {values.Config.https ? 'Yes' : 'No'}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                            {t('dockerSupport')}
                            </span>
                            {values.Config.dockerSupport ? 'Yes' : 'No'}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};
