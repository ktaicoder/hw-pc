import { MakerDeb } from '@electron-forge/maker-deb'
import { MakerRpm } from '@electron-forge/maker-rpm'
import { MakerSquirrel } from '@electron-forge/maker-squirrel'
import { MakerZIP } from '@electron-forge/maker-zip'
import { WebpackPlugin } from '@electron-forge/plugin-webpack'
import type { ForgeConfig } from '@electron-forge/shared-types'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { mainConfig } from './webpack.main.config'
import { rendererConfig } from './webpack.renderer.config'

const config: ForgeConfig = {
  packagerConfig: {
    name: 'aicodiny-hw',
    executableName: 'aicodiny-hw',
    icon: 'build-resources/icons/icon', // no file extension required
    // appBundleId: utils.fromBuildIdentifier({ beta: 'com.aicodiny.pc-hw-beta', prod: 'com.aicodiny.pc-hw' }),
    appBundleId: 'com.aicodiny.pc-hw',
    protocols: [
      {
        name: '',
        schemes: ['ktaicodingblock-hw'],
      },
    ],
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      iconUrl: 'https://aicodiny.com/favicon.ico',
      setupIcon: 'build-resources/icons/icon.ico',
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({
      options: {
        icon: 'build-resources/icons/icon512.png',
      },
    }),
  ],
  hooks: {
    packageAfterPrune: async (forgeConfig, buildPath) => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.resolve(buildPath, 'package.json')).toString(),
      )

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
            name: 'main_window',
            preload: {
              js: './src/preload/index.ts',
            },
          },
        ],
      },
      port: 19992, // default is 3000
      loggerPort: 19993, // default is 9000
    }),
  ],
}

export default config
