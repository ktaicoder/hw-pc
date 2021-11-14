import { MetaDataChannel } from 'src/constants/channels'
import { WindowMeta, WindowNames } from 'src/services/windows/WindowProperties'

export function loadBrowserViewMetaData() {
    const args = process.argv
        .filter((item) => item.startsWith(MetaDataChannel.browserViewMetaData))
        .map((item) => item.replace(MetaDataChannel.browserViewMetaData, ''))

    const windowName = (args[0] as WindowNames) ?? WindowNames.main

    const extraMetaJSONString = decodeURIComponent(args[1] ?? '{}')

    let extraMeta: WindowMeta[WindowNames] = {}
    try {
        extraMeta = JSON.parse(extraMetaJSONString) as WindowMeta[WindowNames]
    } catch (error) {
        console.error(
            `Failed to parse extraMeta. ${
                (error as Error).message
            } extraMeta is ${extraMetaJSONString} and process.argv is ${JSON.stringify(process.argv)}`,
        )
    }
    return { windowName, ...extraMeta }
}
