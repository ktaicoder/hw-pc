import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import type { ForgeConfig } from '@electron-forge/shared-types'
import { MakerSquirrel } from '@electron-forge/maker-squirrel'
import { MakerZIP } from '@electron-forge/maker-zip'
import { MakerDeb } from '@electron-forge/maker-deb'
import { MakerRpm } from '@electron-forge/maker-rpm'
import { WebpackPlugin } from '@electron-forge/plugin-webpack'
import { mainConfig } from './webpack.main.config'
import { rendererConfig } from './webpack.renderer.config'
// import { utils } from '@electron-forge/core'

const config: ForgeConfig = {
  packagerConfig: {
    name: 'aicodiny-hw',
    executableName: 'aicodiny-hw',
    icon: 'build-resources/icons/icon',
    // appBundleId: utils.fromBuildIdentifier({ beta: 'com.aicodiny.pc-hw-beta', prod: 'com.aicodiny.pc-hw' }),
    appBundleId: 'com.aicodiny.pc-hw',
    protocols: [
      {
        name: '',
        schemes: ['ktaicodingblock-hw'],
      },
    ],
  },
  makers: [
    new MakerSquirrel({
      name: 'aicodiny-hw',
      iconUrl: 'https://aicodiny.com/favicon.ico',
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  hooks: {
    packageAfterPrune: async (forgeConfig, buildPath) => {
      console.log('buildPath=', buildPath)

      const packageJson = JSON.parse(fs.readFileSync(path.resolve(buildPath, 'package.json')).toString())

      packageJson.dependencies = {
        serialport: '^10.5.0',
        usb: '^2.8.0',
      }

      fs.writeFileSync(path.resolve(buildPath, 'package.json'), JSON.stringify(packageJson))

      return new Promise((resolve, reject) => {
        const npmInstall = spawn('yarn', ['install', '--production=true'], {
          cwd: buildPath,
          stdio: 'inherit',
          shell: true,
        })

        npmInstall.on('close', (code) => {
          if (code === 0) {
            resolve()
          } else {
            reject(new Error('process finished with error code ' + code))
          }
        })

        npmInstall.on('error', (error) => {
          reject(error)
        })
      })
    },
  },
  plugins: [
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/renderer.ts',
            preload: {
              js: './src/preload/index.ts',
            },
            name: 'main_window',
          },
        ],
      },
      port: 19990, // default is 3000
      loggerPort: 19991, // default is 9000
    }),
  ],
}

export default config
