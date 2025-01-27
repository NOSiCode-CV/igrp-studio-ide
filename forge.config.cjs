const { config } = require('process');
//const { utils: { fromBuildIdentifier } } = require('@electron-forge/core');

//|(tsconfig.*)
module.exports = {
    //buildIdentifier: process.env.IS_BETA ? 'beta' : 'prod',
    packagerConfig: {
        name:"IGRP Studio",
        appBundleId: "cv.nosi.igrpstudio.beta", //fromBuildIdentifier({ beta: 'cv.nosi.igrpstudio.beta"', prod: 'cv.nosi.igrpstudio' }),
        appCategoryType: "public.app-category.developer-tools", // Category for the macOS App Store
        ignore: [
            /^\/src/,
            /(.eslintrc.json)|(^\.gitignore$)|(electron.vite.config.ts)|(forge.config.cjs)/,
        ],
        icon: 'resources/icons/icon',
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                setupExe: 'IGRP_Studio_Setup.exe',
            },
        },
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin'],
            config: {
            },
        },
        {
            name: '@electron-forge/maker-deb',
            config: {},
        },
        {
            name: '@electron-forge/maker-rpm',
            config: {},
        },
    ],
};
