module.exports = {
    packagerConfig: {
        name: 'AiCodingBlockHW',
        executableName: 'AiCodingBlockHW',
        icon: 'build-resources/icons/icon',
    },
    makers: [
        {
            name: "@electron-forge/maker-squirrel",
            config: {
                name: "aimk_hw"
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
            config: {}
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
                            html: "./public/index.html",
                            js: "./src/renderer/index.tsx",
                            preload: {
                                js: './src/preload/index.ts'
                            },
                            name: "main_window"
                        }
                    ]
                }
            }
        ]
    ]
}
