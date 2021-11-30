import {
    tap,
    BehaviorSubject,
    filter,
    map,
    Observable,
    Subject,
    Subscription,
    mergeMap,
    mergeAll,
    merge,
    bufferTime,
    from,
    of,
    EMPTY,
} from 'rxjs'
import io, { Socket } from 'socket.io-client'
import { TERMINAL_CMD_RESPONE, TERMINAL_MESSAGE_RESPONSE } from 'src/hw-server/HwClientHandler'
import { RxSocketIoClient } from './RxSocketIoClient'

type WebSocketState = 'first' | 'connected' | 'disconnected'

export type ResponseFrame = {
    requestId: string
    success: boolean
    error?: string
    body?: any
}

export class HwSocket {
    private _sock: Socket | null = null
    private _subscription: Subscription | null = null
    private _state$ = new BehaviorSubject<WebSocketState>('first')
    private _frameResponse$ = new Subject<ResponseFrame>()
    private _terminalMessage$ = new Subject<string>()

    constructor(public websocketUrl: string) {}

    observeState = (): Observable<WebSocketState> => {
        return this._state$.asObservable()
    }

    ////
    observeTerminalMessage = (): Observable<string> => {
        return this._terminalMessage$.asObservable()
    }

    observeFrameResponse = (requestId: string): Observable<ResponseFrame> => {
        return this._frameResponse$.asObservable().pipe(filter((it) => it.requestId === requestId))
    }

    /**
     * 상태가 정상일때 소켓을 발행한다
     */
    private observeConnectedSocket = (): Observable<Socket | null> => {
        return this._state$.pipe(
            tap((it) => console.log('XXXX SOCKET STATE:' + it)),
            map((it) => (it === 'connected' ? this._sock! : null)),
        )
    }

    isConnected = (): boolean => {
        return this._sock?.connected === true
    }

    isDisconnected = (): boolean => {
        return !this.isConnected()
    }

    connect = () => {
        if (this._sock) {
            return
        }
        this._state$.next('first')
        const sock = io(this.websocketUrl, {
            autoConnect: true,
            path: '/socket.io',
        })
        this._sock = sock
        const subscription = RxSocketIoClient.fromConnectEvent(sock).subscribe(() => {
            this._state$.next('connected')
        })

        subscription.add(
            RxSocketIoClient.fromDisonnectEvent(sock).subscribe((reason) => {
                console.log('disconnected reason:' + reason)
                this._state$.next('disconnected')
                this._onDisconnected(false)
            }),
        )

        subscription.add(
            RxSocketIoClient.fromDisonnectEvent(sock).subscribe((err) => {
                console.log('error occured = ' + err)
            }),
        )

        subscription.add(
            RxSocketIoClient.fromMessageEvent(sock, TERMINAL_CMD_RESPONE)
                .pipe(
                    filter((msg) => {
                        const valid = typeof msg['requestId'] === 'string' && typeof msg['success'] === 'boolean'
                        if (!valid) {
                            console.warn('unknown frame response', msg)
                        }
                        return valid
                    }),
                    map((msg) => msg as ResponseFrame),
                )
                .subscribe((msg) => {
                    this._frameResponse$.next(msg)
                }),
        )

        function splitLines(msgLines: string[]): [string[], string | null] {
            const str = msgLines.join('')
            if (str.length === 0) {
                return [[], null]
            }

            const idx = str.lastIndexOf('\n')
            if (idx < 0) {
                return [[], str]
            }
            if (idx === 0) {
                return [['\n'], str.slice(1)]
            }

            let pending: string | null = str.slice(idx + 1)
            const acceptedLines = str
                .substring(0, idx + 1)
                .split('\n')
                .map((it) => (it.length > 0 ? it + '\n' : ''))

            return [acceptedLines, pending]
        }

        let prevPending: string | null = null
        subscription.add(
            RxSocketIoClient.fromMessageEvent(sock, TERMINAL_MESSAGE_RESPONSE)
                .pipe(map((msg) => msg as string))
                .pipe(
                    bufferTime(300),
                    mergeMap((lines): Observable<string> => {
                        const [acceptedLines, newPending] = splitLines(lines)
                        if (acceptedLines.length > 0) {
                            if (prevPending && prevPending.length > 0) {
                                acceptedLines[0] = prevPending + acceptedLines[0]
                            }
                            prevPending = newPending
                            return from(acceptedLines as string[])
                        } else {
                            // 새로운 pending이 있다면 저장, 다음턴에 보낸다
                            if (newPending && newPending.length > 0) {
                                if (prevPending && prevPending.length > 0) {
                                    prevPending = prevPending + newPending
                                } else {
                                    prevPending = newPending
                                }
                                return EMPTY
                            } else {
                                // 새로운 pending이 없으므로 이전 pending을 보낸다
                                if (prevPending && prevPending.length > 0) {
                                    const v = prevPending
                                    prevPending = null
                                    return of(v)
                                } else {
                                    return EMPTY
                                }
                            }
                        }
                    }),
                    filter((line) => line.length > 0),
                    tap((line) => console.log(`terminal=${line.length}:[${line}]`)),
                )
                .subscribe((msg) => {
                    this._terminalMessage$.next(msg)
                }),
        )
    }

    /**
     * 강제로 연결을 종료한다
     */
    disconnect = () => {
        this._onDisconnected(true)
    }

    private _onDisconnected = (destroy: boolean) => {
        if (destroy) {
            this._subscription?.unsubscribe()
            this._subscription = null

            const s = this._sock
            if (s != null) {
                this._sock?.close()
                this._sock = null
            }
        }

        if (this._state$.value !== 'disconnected') {
            this._state$.next('disconnected')
        }
    }

    send = (messageName: string, frame: any) => {
        const sock = this._sock
        if (!sock) {
            throw new Error('not connected')
        }

        sock.emit(messageName, frame)
    }
}
