'use client';

import { Button } from '@renderer/components/ui/button';
import { Checkbox } from '@renderer/components/ui/checkbox';
import { Separator } from '@renderer/components/ui/separator';
import { CircleArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import logo from '@renderer/assets/images/igrp-green.svg';
import { useTranslation } from 'react-i18next';

export function AboutSettings() {
    const { t } = useTranslation();
    const [appVersion, setAppVersion] = useState('');

    useEffect(() => {
        if (window.electron && window.electron.getAppVersion) {
            window.electron.getAppVersion().then((version) => {
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
                            {import.meta.env.VITE_APP_TITLE} {appVersion}
                        </h2>
                     {/*    <p className="text-sm text-muted-foreground">
                            {t('found_new_version')} 1.0.1
                        </p> */}
                        <div className="flex items-center gap-2 pt-1">
                            <Button className="gap-2" size={'sm'}>
                                <CircleArrowUp className="h-4 w-4" />
                                {t('check_update')}
                            </Button>
                            <Button variant="link" className="h-8" size={'sm'}>
                                {t('changelog')}
                            </Button>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Software Update */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium">{t('software_update')}</h3>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="notifications" />
                        <label
                            htmlFor="notifications"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            {t('remind_me')}
                        </label>
                    </div>
                </div>

                <Separator />

                {/* Other Information */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium">{t('other_information')}</h3>
                    <div className="space-y-2">
                        <Button variant="link" className="h-8 p-0" size={'sm'}>
                            {t('get_latest_version')}
                        </Button>
                        <br />
                        <Button variant="link" className="h-8 p-0" size={'sm'}>
                            {t('terms_of_service')}
                        </Button>
                        <br />
                        <Button variant="link" className="h-8 p-0" size={'sm'}>
                            {t('privacy_policy')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
