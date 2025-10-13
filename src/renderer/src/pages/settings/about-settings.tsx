// noinspection ES6MissingAwait

'use client';

import {
    IGRPButtonPrimitive,
    IGRPCheckboxPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPSeparator } from '@igrp/igrp-framework-react-design-system';
import { CircleArrowUp, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import logo from '@renderer/assets/images/igrp-green.svg';
import { useTranslation } from 'react-i18next';
import useToast from '@renderer/hooks/useToast';

export function AboutSettings() {
    const { t } = useTranslation();
    const { showWarningToast } = useToast();
    const [appVersion, setAppVersion] = useState('');
    const [newVersion, setNewVersion] = useState<string>('');
    const [isDownloading, setIsDownloading] = useState(false);

    const checkForUpdates = async () => {
        const newVersion = await window.electron.checkForUpdates();
        if (newVersion !== appVersion && appVersion) {
            setNewVersion(newVersion);
        } else
            showWarningToast(
                `Update for version ${appVersion} is not available`
            );
    };

    const downloadAndInstall = async () => {
        setIsDownloading(true);
        await window.electron.downloadUpdate();
        window.electron.installUpdate();
        setIsDownloading(false);
    };

    useEffect(() => {
        if (window.electron && window.electron.getAppVersion) {
            window.electron.getAppVersion().then((version: string) => {
                setAppVersion(version);
            });
        }
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

                        {newVersion ? (
                            <p className="text-sm text-igrp">
                                {t('found_new_version')} {newVersion}
                            </p>
                        ) : (
                            <p className="text-muted-foreground">
                                {t('currentVersion', {
                                    version: appVersion,
                                })}
                            </p>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                            {!newVersion ? (
                                <IGRPButtonPrimitive
                                    className="gap-2"
                                    size="sm"
                                    onClick={checkForUpdates}
                                >
                                    <CircleArrowUp className="h-4 w-4" />
                                    {t('check_update')}
                                </IGRPButtonPrimitive>
                            ) : (
                                <IGRPButtonPrimitive
                                    className="gap-2"
                                    size="sm"
                                    onClick={downloadAndInstall}
                                    disabled={isDownloading}
                                >
                                    <Download className="h-4 w-4" />
                                    {isDownloading
                                        ? t('downloading')
                                        : t('downloadInstall')}
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
                    <div className="space-y-1">
                        <IGRPButtonPrimitive variant="link" size={'sm'}>
                            {t('get_latest_version')}
                        </IGRPButtonPrimitive>
                        <IGRPButtonPrimitive variant="link" size={'sm'}>
                            {t('terms_of_service')}
                        </IGRPButtonPrimitive>
                        <IGRPButtonPrimitive variant="link" size={'sm'}>
                            {t('privacy_policy')}
                        </IGRPButtonPrimitive>
                    </div>
                </div>
            </div>
        </div>
    );
}
