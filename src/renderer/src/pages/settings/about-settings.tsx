'use client';

import { Button } from '@renderer/components/ui/button';
import { Checkbox } from '@renderer/components/ui/checkbox';
import { Separator } from '@renderer/components/ui/separator';
import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import logo from '@renderer/assets/images/igrp-blue.svg';

export function AboutSettings() {
    const [appVersion, setAppVersion] = useState('');

    useEffect(() => {
        // Fetch app version from Electron
        if (window.electron && window.electron.getAppVersion) {
            window.electron.getAppVersion().then((version) => {
                setAppVersion(version);
            });
        }
    }, []);

    return (
        <div>
            <div className="pb-4">
                <h2 className="text-lg font-semibold">About</h2>
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
                            IGRP Studio {appVersion}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Found a new version 1.0.1
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                            <Button className="gap-2">
                                <Download className="h-4 w-4" />
                                Install and Restart
                            </Button>
                            <Button variant="link" className="h-8">
                                Changelog
                            </Button>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Software Update */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium">Software Update</h3>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="notifications" />
                        <label
                            htmlFor="notifications"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Remind me when a new version is available for
                            download
                        </label>
                    </div>
                </div>

                <Separator />

                {/* Other Information */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium">Other Information</h3>
                    <div className="space-y-2">
                        <Button variant="link" className="h-8 p-0" size={'sm'}>
                            Get Latest Version
                        </Button>
                        <br />
                        <Button variant="link" className="h-8 p-0" size={'sm'}>
                            Terms of Service
                        </Button>
                        <br />
                        <Button variant="link" className="h-8 p-0" size={'sm'}>
                            Privacy Policy
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
