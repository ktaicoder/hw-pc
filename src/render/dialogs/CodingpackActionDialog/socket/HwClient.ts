import {
    concat,
    concatMapTo,
    debounceTime,
    delay,
    filter,
    firstValueFrom,
    map,
    mergeMapTo,
    Observable,
    of,
    take,
    takeLast,
    tap,
    timeout,
} from 'rxjs'
import { OPEN_TERMINAL_REQUEST, TERMINAL_MESSAGE_REQUEST } from 'src/hw-server/HwClientHandler'
import { ControlKeys } from 'src/render/components/react-console/ReactConsole'
import stripAnsi from 'strip-ansi'
import { HwSocket, ResponseFrame } from './HwSocket'

export type WifiAp = {
    ssid: string
    signal: number
    wpa1: boolean
    wpa2: boolean
}
export type NetworkInterface = {
    iface: string
    mac: string
    ip?: string
    connection?: string
}

export type Disk = {
    total: string
    used: string
    avail: string
    usedPercent: string
}

export type CodingpackInfo = {
    model: string
    modelType: string
    networkInterfaces: NetworkInterface[]
    disk?: Disk
    cpuCount: number
    cpuModel: string
    cpuHardware: string
    cpuArch: string
    cpuArchModel: string
    cpuMHz: number
    memTotal: string
}

function nextRequestId() {
    return Math.random().toString(36).substring(2) + Date.now()
}

const toBase64 = (u8: Uint8Array) => {
    return btoa(String.fromCharCode.apply(null, u8))
}

const isPrompt = (line: string): boolean => {
    const yes = /^pi@raspberrypi:(~|\/)/.test(line)
    if (yes) {
        console.log('line is prompt:' + line)
    } else {
        console.log('line is not prompt:' + line)
    }
    return yes
}

const _escapeQuote = (str: string) => {
    if (str.includes('"')) {
        return `'${str}'`
    } else if (str.includes("'")) {
        return `"${str}"`
    }
    return str
}

// WPA1 WPA2  100     abcd
// WPA2       100     ohlab5g
// WPA2       39      DIRECT-suC145x Series
// WPA2       35      DIRECT-TAC48x Series

function parseWifiList(output: string): WifiAp[] {
    const lines = output
        .split(/[\r\n]+/)
        .map((it) => it.trim())
        .filter((it) => it.length > 0)
        .filter((it) => it.includes('WPA1') || it.includes('WPA2'))
    const list: WifiAp[] = []
    for (let line of lines) {
        let wpa1 = false
        let wpa2 = false
        let ssid = ''
        let signal = 0
        if (line.startsWith('WPA1')) {
            line = line.replace(/^WPA1\s*/, '')
            wpa1 = true
        }
        if (line.startsWith('WPA2')) {
            line = line.replace(/^WPA2\s*/, '')
            wpa2 = true
        }
        signal = parseInt(line)
        ssid = line.replace(/^\s*[0-9]+\s*/, '').trim()
        list.push({
            ssid,
            signal,
            wpa1,
            wpa2,
        })
    }
    return list
}

function formatByteCount(size: number): string {
    const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    if (size === 1) return '1 byte'

    let l = 0
    let n = size
    while (n >= 1024 && ++l) {
        n = n / 1024
    }

    return n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l]
}

function parseMemTotal(str: string) {
    str = str.toLowerCase()
    if (!str.includes('kb')) {
        return str
    }
    return formatByteCount(parseInt(str) * 1024)
}

function parseInspect(output: string): CodingpackInfo | null {
    const lines = output
        .split(/[\r\n]+/)
        .map((it) => it.trim())
        .filter((it) => it.length > 0)

    let model: string | undefined = undefined
    let modelType: string | undefined = undefined
    let networkInterfaces: NetworkInterface[] = []
    let disk: Disk | undefined = undefined
    let cpuCount = 0
    let cpuModel: string | undefined = undefined
    let cpuHardware: string | undefined = undefined
    let memTotal: string | undefined = undefined
    let cpuArch: string = ''
    let cpuArchModel: string = ''
    let cpuMHz: number = 0

    for (let line of lines) {
        if (line.startsWith('MODEL=')) {
            model = line.substring('MODEL='.length)
        } else if (line.startsWith('MODEL_TYPE=')) {
            modelType = line.substring('MODEL_TYPE='.length)
        } else if (line.startsWith('CPU_COUNT=')) {
            cpuCount = +line.substring('CPU_COUNT='.length)
        } else if (line.startsWith('CPU_MODEL=')) {
            cpuModel = line.substring('CPU_MODEL='.length)
        } else if (line.startsWith('CPU_ARCH=')) {
            cpuArch = line.substring('CPU_ARCH='.length)
        } else if (line.startsWith('CPU_ARCH_MODEL=')) {
            cpuArchModel = line.substring('CPU_ARCH_MODEL='.length)
        } else if (line.startsWith('CPU_HARDWARE=')) {
            cpuHardware = line.substring('CPU_HARDWARE='.length)
        } else if (line.startsWith('CPU_MHZ=')) {
            cpuMHz = +line.substring('CPU_MHZ='.length)
        } else if (line.startsWith('MEMORY=')) {
            memTotal = parseMemTotal(line.substring('MEMORY='.length))
        } else if (line.startsWith('NET=')) {
            const items = line.substring('NET='.length).split(';')
            if (items.length !== 4) {
                console.warn('cannot parse network line:' + line)
            } else {
                networkInterfaces.push({
                    iface: items[0],
                    mac: items[1],
                    ip: items[2],
                    connection: items[3],
                })
            }
        } else if (line.startsWith('DISK=')) {
            const items = line.substring('DISK='.length).split(' ')
            if (items.length !== 4) {
                console.warn('cannot parse disk line:' + line)
            } else {
                disk = {
                    total: items[0],
                    used: items[1],
                    avail: items[2],
                    usedPercent: items[3],
                }
            }
        }
    }
    if (!model || !modelType) {
        return null
    }
    return {
        model,
        modelType,
        networkInterfaces,
        disk,
        cpuCount,
        cpuMHz,
        cpuModel: cpuModel ?? '-',
        cpuHardware: cpuHardware ?? '-',
        cpuArch,
        cpuArchModel,
        memTotal: memTotal ?? '-',
    }
}

export class HwClient {
    socket: HwSocket

    constructor(public readonly hwId: string, websocketUrl: string) {
        this.socket = new HwSocket(websocketUrl)
    }

    /**
     * ?????? ?????? ??????
     * @returns ?????? ??????
     */
    isConnected = (): boolean => this.socket.isConnected()

    /**
     * ?????? ?????? ?????? ??????
     * @returns ?????? ?????? ??????
     */
    isDisonnected = (): boolean => this.socket.isDisconnected()

    /**
     * ????????? ????????????
     */
    connect = () => {
        this.socket.connect()
    }

    /**
     * ????????? ?????????
     */
    disconnect = () => {
        this.socket.disconnect()
    }

    /**
     * ?????? ?????? ????????????
     * @returns ?????? ?????? ????????????
     */
    observeConnected = (): Observable<boolean> => {
        return this.socket.observeState().pipe(map((it) => it === 'connected'))
    }

    /**
     * ????????? ????????? ????????????
     * @param timeoutMilli ???????????? ?????????, 0?????? ????????? ???????????? ??????
     */
    waitForConnected = async (timeoutMilli = 0): Promise<void> => {
        const src$ = this.socket.observeState().pipe(map((it) => it === 'connected'))
        if (timeoutMilli > 0) {
            await firstValueFrom(src$.pipe(timeout(timeoutMilli)))
        } else {
            await firstValueFrom(src$)
        }
    }

    /**
     * ???????????? ????????? ????????????.
     * ????????? ????????????.
     * ????????? ????????? ???????????? ???????????? ????????? ????????????.
     *
     * @param hwId ???????????? ID
     * @param cmd ?????????
     * @param args ????????? ????????????
     */
    sendAndWait = async (messageName: string, requestBody: any): Promise<ResponseFrame> => {
        const requestId = nextRequestId()

        // ????????? ?????? ?????? ???????????? ????????? ????????????
        this.socket.send(messageName, {
            requestId,
            ...requestBody,
        })

        return await firstValueFrom(this.socket.observeFrameResponse(requestId))
    }

    observeTerminalMessage = (): Observable<string> => {
        return this.socket.observeTerminalMessage().pipe(map((line) => stripAnsi(line)))
    }

    observeTerminalPrompt = (): Observable<boolean> => {
        return this.socket.observeTerminalMessage().pipe(
            map(isPrompt),
            tap((ok) => {
                // console.log('????????? ???????????????????' + ok)
            }),
        )
    }

    sendOpenTerminalRequest = () => {
        const requestId = nextRequestId()
        this.socket.send(OPEN_TERMINAL_REQUEST, {
            requestId,
            hwId: this.hwId,
        })
    }

    sendBinary = (cmdline: Uint8Array) => {
        const requestId = nextRequestId()
        this.socket.send(TERMINAL_MESSAGE_REQUEST, {
            requestId,
            hwId: this.hwId,
            data: toBase64(cmdline),
            contentEncoding: 'base64',
        })
    }

    sendTextLine = (cmdline: string) => {
        this.sendText(cmdline + '\n')
    }

    sendText = (cmdline: string) => {
        console.log('sendText:' + cmdline)
        const requestId = nextRequestId()
        this.socket.send(TERMINAL_MESSAGE_REQUEST, {
            requestId,
            hwId: this.hwId,
            data: cmdline,
        })
    }

    runWifiList = (): Observable<WifiAp[]> => {
        return this._runCmdWithOutput('sh /usr/local/bin/aimk-wifi-list.sh 3').pipe(
            map((lines) => parseWifiList(lines.join(''))),
        )
    }

    runInspect = (): Observable<CodingpackInfo | null> => {
        return this._runCmdWithOutput('sh /usr/local/bin/aimk-inspect.sh').pipe(
            map((lines) => parseInspect(lines.join(''))),
        )
    }

    runAudioTest = (): Observable<any> => {
        return this._runCmd('yes | sh /usr/local/bin/aimk-check-audio.sh')
    }

    runReboot = (): Observable<any> => {
        return this._runCmd('sudo reboot')
    }

    runSystemReset = (): Observable<any> => {
        return this._runCmd('yes | sh /home/pi/blockcoding/kt_ai_makers_kit_block_coding_driver/blockDriver/reset.sh')
    }

    runCodingpackUpdate = (): Observable<any> => {
        return this._runCmd(
            'yes | sudo sh /home/pi/blockcoding/kt_ai_makers_kit_block_coding_driver/blockDriver/check-update.sh',
        )
    }

    runRescue = (): Observable<any> => {
        return this._runCmd(
            'curl https://raw.githubusercontent.com/aicodingblock/reset_blockdriver/release/blockDriver/rescue.sh | bash',
        )
    }

    runWifiSsidChange = (ssid: string, pw: string): Observable<any> => {
        return this._runCmd(`sudo nmcli device wifi connect ${_escapeQuote(ssid)} password ${_escapeQuote(pw)}`)
    }

    runPasswdChange = (newPassword: string): Observable<any> => {
        const str = _escapeQuote(`pi:${newPassword}`)
        return this._runCmd(`echo ${str} | sudo chpasswd`)
    }

    runAutoRunCreate = (url: string): Observable<any> => {
        return this._runCmd(`aimk-auto-run-file.sh create ${url}`)
    }

    runAutoRunRemove = (): Observable<any> => {
        return this._runCmd(`aimk-auto-run-file.sh remove`)
    }

    private _sendTextObservable = (text: string, afterDelayMs = 200): Observable<any> => {
        return new Observable((emitter) => {
            this.sendText(text)
            emitter.next(true)
            emitter.complete()
        }).pipe(delay(afterDelayMs))
    }

    private _sendBinaryObservable = (value: Uint8Array, afterDelayMs = 200): Observable<any> => {
        return new Observable((emitter) => {
            this.sendBinary(value)
            emitter.next(true)
            emitter.complete()
        }).pipe(delay(afterDelayMs))
    }

    cancelTerminalInput = (): Observable<any> => {
        return concat(
            this._sendTextObservable('\n', 200),
            this._sendBinaryObservable(new Uint8Array(ControlKeys.c)),
            this._sendBinaryObservable(new Uint8Array(ControlKeys.c)),
            this._sendBinaryObservable(new Uint8Array(ControlKeys.d)),
            this._sendBinaryObservable(new Uint8Array(ControlKeys.c)),
            this._sendBinaryObservable(new Uint8Array(ControlKeys.d)),
            this.observeTerminalPrompt().pipe(
                debounceTime(200),
                filter((it) => it === true),
                take(1),
            ),
        ).pipe(takeLast(1))
    }

    private _runCmd = (cmd: string): Observable<any> => {
        // ctrl+d??? ?????? ?????????
        // prompt ????????????
        // ?????? ?????????
        // prompt??? ????????????.
        return concat(
            this._sendBinaryObservable(new Uint8Array(ControlKeys.d)),
            this._sendBinaryObservable(new Uint8Array(ControlKeys.d)),
            this.observeTerminalPrompt().pipe(
                debounceTime(200),
                filter((it) => it === true),
                take(1),
                tap(() => this.sendTextLine(cmd)),
                concatMapTo(this.observeTerminalPrompt()),
                debounceTime(200),
                filter((it) => it === true),
                take(1),
            ),
        ).pipe(takeLast(1))
    }

    observeCmdResultCapture = (): Observable<string[]> => {
        const lines: string[] = []
        // this.observeTerminalPrompt()
        return of(1).pipe(
            // filter((it) => it === true),
            mergeMapTo(
                this.socket.observeTerminalMessage().pipe(
                    filter((msg) => {
                        if (!isPrompt(msg)) {
                            lines.push(msg)
                            return false
                        } else {
                            return true
                        }
                    }),
                    map(() => lines),
                    take(1),
                ),
            ),
        )
    }
    private _runCmdWithOutput = (cmd: string): Observable<string[]> => {
        // ctrl+d??? ?????????
        // prompt ????????????
        // ?????? ?????????
        // prompt??? ????????????.
        const lines: string[] = []

        return this._sendBinaryObservable(new Uint8Array(ControlKeys.d), 0)
            .pipe(
                concatMapTo(this._sendBinaryObservable(new Uint8Array(ControlKeys.d))),
                concatMapTo(
                    this.observeTerminalPrompt().pipe(
                        debounceTime(200),
                        filter((it) => it === true),
                        take(1),
                    ),
                ),
                tap(() => this.sendTextLine(cmd)),
                concatMapTo(
                    this.socket.observeTerminalMessage().pipe(
                        filter((msg) => {
                            console.log('check output = ' + msg)
                            if (!isPrompt(msg)) {
                                lines.push(msg)
                                return false
                            } else {
                                return true
                            }
                        }),
                        map(() => lines),
                        take(1),
                    ),
                ),
            )
            .pipe(takeLast(1))
    }
}
