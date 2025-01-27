const { config } = require('process');
//|(tsconfig.*)
module.exports = {
    packagerConfig: {
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
            config: {},
        },
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin'],
            config: {},
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
