module.exports = {
    packagerConfig: {
        name: 'aicodingblock-hw',
        executableName: 'aicodingblock-hw',
        icon: 'build-resources/icons/icon',
    },
    makers: [
        {
            name: "@electron-forge/maker-squirrel",
            config: {
                name: "aicodingblock-hw"
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
