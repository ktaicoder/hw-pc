const { utils: { fromBuildIdentifier } } = require('@electron-forge/core');

module.exports = {
    packagerConfig: {
        name: 'aicodiny-hw',
        executableName: 'aicodiny-hw',
        icon: 'build-resources/icons/icon',
        appBundleId: fromBuildIdentifier({ beta: 'com.aicodiny.pc-hw-beta', prod: 'com.aicodiny.pc-hw' }),
        protocols: [
            {
                name: '',
                schemas: ['ktaicodingblock-hw']
            }
        ],
    },
    makers: [
        {
            name: "@electron-forge/maker-squirrel",
            config: {
                name: "aicodiny-hw",
                iconUrl: "https://aicodiny.com/favicon.ico"
            }
        },
        {
            name: "@electron-forge/maker-zip",
            platforms: [
                "darwin"
            ]
        },
        {
            name: "@electron-forge/maker-deb",
            config: {
                mimeType: ['x-scheme-handler/ktaicodingblock-hw']
            }
        },
        {
            name: "@electron-forge/maker-rpm",
            config: {}
        }
    ],
    plugins: [
        // ['@electron-forge/plugin-auto-unpack-natives'],
        [
            "@electron-forge/plugin-webpack",
            {
                mainConfig: "./webpack.main.config.js",
                renderer: {
                    config: "./webpack.renderer.config.js",
                    entryPoints: [
                        {
                            html: "./src/index.html",
                            js: "./src/renderer.ts",
                            preload: {
                                js: './src/preload/index.ts'
                            },
                            name: "main_window"
                        }
                    ]
                },
                "port": 19990, // default is 3000
                "loggerPort": 19991, // default is 9000
            }
        ]
    ]
}
