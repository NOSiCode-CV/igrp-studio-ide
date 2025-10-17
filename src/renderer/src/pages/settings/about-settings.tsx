// noinspection ES6MissingAwait

'use client';

import {
    IGRPButtonPrimitive,
    IGRPCheckboxPrimitive,
    IGRPDialogPrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogTitlePrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogFooterPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPSeparator } from '@igrp/igrp-framework-react-design-system';
import { CircleArrowUp, Download, RefreshCw, Loader2 } from 'lucide-react';
import { useEffect, useState, JSX } from 'react';
import logo from '@renderer/assets/images/igrp-green.svg';
import { useTranslation } from 'react-i18next';
import useToast from '@renderer/hooks/useToast';

interface UpdateMessage {
    type:
        | 'checking'
        | 'available'
        | 'not-available'
        | 'error'
        | 'progress'
        | 'downloaded';
    message: string;
    version?: string;
    currentVersion?: string;
    releaseNotes?: string;
    releaseDate?: string;
    progress?: number;
    error?: string;
}

export function AboutSettings(): JSX.Element {
    const { t } = useTranslation();
    const { showWarningToast, showSuccessToast } = useToast();
    const [appVersion, setAppVersion] = useState('');
    const [updateInfo, setUpdateInfo] = useState<UpdateMessage | null>(null);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

    const checkForUpdates = async (): Promise<void> => {
        setIsCheckingUpdate(true);
        try {
            const newVersion = await window.electron.checkForUpdates?.();
            if (!newVersion || newVersion === appVersion) {
                showSuccessToast(
                    `✅ ${t('you_are_running_latest_version') || 'You are running the latest version'}`
                );
            }
        } catch {
            showWarningToast(
                `❌ ${t('update_check_failed') || 'Failed to check for updates'}`
            );
        } finally {
            setIsCheckingUpdate(false);
        }
    };

    const handleInstallUpdate = async (): Promise<void> => {
        try {
            await window.electron.installUpdate?.();
        } catch (err) {
            console.error('Error installing update:', err);
        }
    };

    const formatReleaseNotes = (notes?: string): JSX.Element[] | null => {
        if (!notes) return null;

        return notes.split('\n').map((line, i) => {
            if (line.startsWith('## ')) {
                return (
                    <h3 key={i} className="font-semibold mt-3 mb-1">
                        {line.replace('## ', '')}
                    </h3>
                );
            }
            if (line.startsWith('- ')) {
                return (
                    <li key={i} className="ml-4">
                        {line.replace('- ', '')}
                    </li>
                );
            }
            if (line.trim() === '') {
                return <br key={i} />;
            }
            return (
                <p key={i} className="text-sm">
                    {line}
                </p>
            );
        });
    };

    useEffect(() => {
        if (window.electron?.getAppVersion) {
            window.electron.getAppVersion().then((version: string) => {
                setAppVersion(version);
            });
        }
    }, []);

    useEffect(() => {
        const handleUpdateMessage = (
            _event: Electron.IpcRendererEvent,
            data: UpdateMessage
        ): void => {
            setUpdateInfo(data);

            if (
                data.type === 'available' ||
                data.type === 'progress' ||
                data.type === 'downloaded'
            ) {
                setUpdateDialogOpen(true);
                setIsCheckingUpdate(false);
            }

            if (data.type === 'not-available') {
                setIsCheckingUpdate(false);
            }
        };

        window.electron.ipcRenderer.on('message-update', handleUpdateMessage);

        return () => {
            window.electron.ipcRenderer.removeListener(
                'message-update',
                handleUpdateMessage
            );
        };
    }, []);

    return (
        <div>
            <div className="pb-4">
                <h2 className="text-lg font-semibold">{t('about')}</h2>
            </div>
            <div className="space-y-6">
                {/* App Info */}
                <div className="flex items-start space-x-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg border bg-background flex items-center justify-center">
                        <img
                            src={logo}
                            alt="App icon"
                            width={56}
                            height={56}
                            className="object-cover"
                        />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold">
                            {import.meta.env.VITE_APP_TITLE}
                        </h2>

                        {updateInfo?.version &&
                        updateInfo.version !== appVersion ? (
                            <div className="space-y-1">
                                <p className="text-sm text-igrp font-medium">
                                    {t('found_new_version') ||
                                        'New version available'}{' '}
                                    {updateInfo.version}
                                </p>
                                {updateInfo.type === 'progress' && (
                                    <p className="text-xs text-muted-foreground">
                                        {t('downloading') || 'Downloading'}...{' '}
                                        {updateInfo.progress}%
                                    </p>
                                )}
                                {updateInfo.type === 'downloaded' && (
                                    <p className="text-xs text-green-600">
                                        ✓{' '}
                                        {t('ready_to_install') ||
                                            'Ready to install'}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">
                                {t('currentVersion', {
                                    version: appVersion,
                                }) || `Version ${appVersion}`}
                            </p>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                            {updateInfo?.type === 'downloaded' ? (
                                <IGRPButtonPrimitive
                                    className="gap-2"
                                    size="sm"
                                    onClick={handleInstallUpdate}
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    {t('install_restart') ||
                                        'Install & Restart'}
                                </IGRPButtonPrimitive>
                            ) : updateInfo?.type === 'progress' ||
                              updateInfo?.type === 'available' ? (
                                <IGRPButtonPrimitive
                                    className="gap-2"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setUpdateDialogOpen(true)}
                                >
                                    <Download className="h-4 w-4 animate-pulse" />
                                    {t('view_progress') || 'View Progress'}
                                </IGRPButtonPrimitive>
                            ) : (
                                <IGRPButtonPrimitive
                                    className="gap-2"
                                    size="sm"
                                    onClick={checkForUpdates}
                                    disabled={isCheckingUpdate}
                                >
                                    {isCheckingUpdate ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <CircleArrowUp className="h-4 w-4" />
                                    )}
                                    {t('check_update') || 'Check for Updates'}
                                </IGRPButtonPrimitive>
                            )}
                        </div>
                    </div>
                </div>

                <IGRPSeparator />

                {/* Software Update */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium">
                        {t('software_update')}
                    </h3>
                    <div className="flex items-center space-x-2">
                        <IGRPCheckboxPrimitive id="notifications" />
                        <label
                            htmlFor="notifications"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            {t('remind_me')}
                        </label>
                    </div>
                </div>

                <IGRPSeparator />

                {/* Other Information */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium">
                        {t('other_information')}
                    </h3>
                    <div className="flex flex-row items-start space-y-1">
                        <IGRPButtonPrimitive
                            variant="link"
                            size={'sm'}
                            onClick={() =>
                                window.electron.ipcRenderer.send(
                                    'open-external-url',
                                    'https://igrp.cv/en'
                                )
                            }
                        >
                            {t('get_latest_version') || 'Get Latest Version'}
                        </IGRPButtonPrimitive>
                        <IGRPButtonPrimitive
                            variant="link"
                            size={'sm'}
                            onClick={() =>
                                window.electron.ipcRenderer.send(
                                    'open-external-url',
                                    'https://igrp.cv/en/terms'
                                )
                            }
                        >
                            {t('terms_of_service') || 'Terms of Service'}
                        </IGRPButtonPrimitive>
                        <IGRPButtonPrimitive
                            variant="link"
                            size={'sm'}
                            onClick={() =>
                                window.electron.ipcRenderer.send(
                                    'open-external-url',
                                    'https://igrp.cv/en/privacy'
                                )
                            }
                        >
                            {t('privacy_policy') || 'Privacy Policy'}
                        </IGRPButtonPrimitive>
                    </div>
                </div>
            </div>

            {/* Update Dialog with Release Notes */}
            <IGRPDialogPrimitive
                open={updateDialogOpen}
                onOpenChange={setUpdateDialogOpen}
            >
                <IGRPDialogContentPrimitive className="max-w-2xl max-h-[80vh]">
                    <IGRPDialogHeaderPrimitive>
                        <IGRPDialogTitlePrimitive className="flex items-center gap-2">
                            {(updateInfo?.type === 'available' ||
                                updateInfo?.type === 'progress') && (
                                <>
                                    <Download className="h-5 w-5 text-blue-500 animate-pulse" />
                                    {t('downloading_update') ||
                                        'Downloading Update...'}
                                </>
                            )}
                            {updateInfo?.type === 'downloaded' && (
                                <>
                                    <RefreshCw className="h-5 w-5 text-green-500" />
                                    {t('update_ready') ||
                                        'Update Ready to Install'}
                                </>
                            )}
                        </IGRPDialogTitlePrimitive>
                        <IGRPDialogDescriptionPrimitive>
                            {updateInfo?.currentVersion &&
                                updateInfo?.version && (
                                    <span className="text-sm">
                                        {t('version') || 'Version'}{' '}
                                        {updateInfo.currentVersion} &rarr;{' '}
                                        {updateInfo.version}
                                    </span>
                                )}
                            {updateInfo?.releaseDate && (
                                <span className="text-xs text-muted-foreground ml-2">
                                    {t('released') || 'Released'}:{' '}
                                    {new Date(
                                        updateInfo.releaseDate
                                    ).toLocaleDateString()}
                                </span>
                            )}
                        </IGRPDialogDescriptionPrimitive>
                    </IGRPDialogHeaderPrimitive>

                    {/* Release Notes Section */}
                    {updateInfo?.releaseNotes && (
                        <div className="mt-4 space-y-2">
                            <h4 className="font-semibold text-sm">
                                {t('whats_new') || "What's New:"}
                            </h4>
                            <div className="bg-muted/50 rounded-md p-4 max-h-[400px] overflow-y-auto">
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    {formatReleaseNotes(
                                        updateInfo.releaseNotes
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Progress indicator */}
                    {updateInfo?.type === 'progress' &&
                        updateInfo.progress !== undefined && (
                            <div className="mt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm">
                                        {t('downloading') || 'Downloading'}...
                                    </span>
                                    <span className="text-sm font-semibold">
                                        {updateInfo.progress}%
                                    </span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all duration-300"
                                        style={{
                                            width: `${updateInfo.progress}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                    <IGRPDialogFooterPrimitive className="mt-6">
                        {(updateInfo?.type === 'available' ||
                            updateInfo?.type === 'progress') && (
                            <IGRPButtonPrimitive
                                variant="outline"
                                onClick={() => setUpdateDialogOpen(false)}
                            >
                                {t('continue_background') ||
                                    'Continue in Background'}
                            </IGRPButtonPrimitive>
                        )}
                        {updateInfo?.type === 'downloaded' && (
                            <>
                                <IGRPButtonPrimitive
                                    variant="outline"
                                    onClick={() => setUpdateDialogOpen(false)}
                                >
                                    {t('install_later') || 'Install Later'}
                                </IGRPButtonPrimitive>
                                <IGRPButtonPrimitive
                                    onClick={handleInstallUpdate}
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    {t('install_restart') ||
                                        'Install & Restart'}
                                </IGRPButtonPrimitive>
                            </>
                        )}
                    </IGRPDialogFooterPrimitive>
                </IGRPDialogContentPrimitive>
            </IGRPDialogPrimitive>
        </div>
    );
}
