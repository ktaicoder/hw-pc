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

export class HwClient {
    socket: HwSocket

    constructor(public readonly hwId: string, websocketUrl: string) {
        this.socket = new HwSocket(websocketUrl)
    }

    /**
     * 연결 여부 체크
     * @returns 연결 여부
     */
    isConnected = (): boolean => this.socket.isConnected()

    /**
     * 연결 종료 여부 체크
     * @returns 연결 종료 여부
     */
    isDisonnected = (): boolean => this.socket.isDisconnected()

    /**
     * 연결을 시도한다
     */
    connect = () => {
        this.socket.connect()
    }

    /**
     * 연결을 끊는다
     */
    disconnect = () => {
        this.socket.disconnect()
    }

    /**
     * 연결 여부 모니터링
     * @returns 연결 여부 옵저버블
     */
    observeConnected = (): Observable<boolean> => {
        return this.socket.observeState().pipe(map((it) => it === 'connected'))
    }

    /**
     * 연결될 때까지 기다리기
     * @param timeoutMilli 타임아웃 밀리초, 0보다 작으면 타임아웃 없음
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
     * 하드웨어 명령을 전송한다.
     * 응답을 기다린다.
     * 연결이 끊어진 상태에서 호출하면 예외가 발생한다.
     *
     * @param hwId 하드웨어 ID
     * @param cmd 명령어
     * @param args 명령어 파라미터
     */
    sendAndWait = async (messageName: string, requestBody: any): Promise<ResponseFrame> => {
        const requestId = nextRequestId()

        // 연결이 안된 채로 호출하면 예외가 발생한다
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
                console.log('터미널 프롬프트인가?' + ok)
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
        return this._runCmd(`sudo nmcli device wifi connect '${ssid}' password '${pw}'`)
    }

    runPasswdChange = (newPassword: string): Observable<any> => {
        return this._runCmd(`echo pi:${newPassword} | sudo chpasswd`)
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
        // ctrl+d를 두번 보내고
        // prompt 기다리고
        // 명령 보내고
        // prompt를 기다린다.
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
        // ctrl+d를 두번 보내고
        // prompt 기다리고
        // 명령 보내고
        // prompt를 기다린다.
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
