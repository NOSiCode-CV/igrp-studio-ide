import generated from '@electron-forge/core';

const { utils: { fromBuildIdentifier } } = generated;

module.exports = {
    buildIdentifier: 'beta', //process.env.IS_BETA ? 'beta' : 'prod',
    packagerConfig: {
        name: 'IGRP Studio',
        appBundleId: fromBuildIdentifier({
            beta: 'cv.nosi.igrpstudio.beta',
            prod: 'cv.nosi.igrpstudio',
        }),
        appCategoryType: 'public.app-category.developer-tools',
        ignore: [
            /^\/src/,
            /^\/\.vscode/,
            // /^\/node_modules/,
            /\.eslintrc\.json$/,
            /\.gitignore$/,
            /electron\.vite\.config\.ts$/,
            /forge\.config\.cjs$/,
            // /tsconfig\.json$/,
        ],
        icon: 'resources/icons/icon',
        win32metadata: {
            CompanyName: 'NOSI',
            FileDescription: 'IGRP Studio for dev',
            ProductName: 'IGRP Studio',
        }
    },
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                setupExe: 'IGRP_Studio_Setup.exe',
                iconUrl: 'https://igrp.cv/favicon.ico',
                setupIcon: 'resources/icons/icon.ico',
            },
        },
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin'],
            config: {
                icon: 'resources/icons/icon.icns',
            },
        },
        {
            name: '@electron-forge/maker-deb',
            config: {
                options: {
                    icon: 'resources/icons/icon.png',
                },
            },
        },
        {
            name: '@electron-forge/maker-rpm',
            config: {
                options: {
                    icon: 'resources/icons/icon.png',
                },
            },
        },
    ],
};
