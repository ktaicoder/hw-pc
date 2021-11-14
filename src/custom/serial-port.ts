import { Buffer } from 'buffer'
import { filter, finalize, firstValueFrom, map, Observable, Subject, Subscription, take, tap } from 'rxjs'
import SerialPort from 'serialport'
import Stream from 'stream'
import { ISerialPortInfo } from 'src/custom-types/base-types'

const DEBUG = false

export type SerialPortMatchFn = (portInfo: ISerialPortInfo) => boolean
export type SerialPortHelperCreateFn = (path: string) => SerialPortHelper

/**
 * 시리얼 포트 하드웨어의 메타 정보
 */
export type SerialPortOperator = {
    isMatch: SerialPortMatchFn
    createSerialPortHelper: SerialPortHelperCreateFn
}

export type HwOperator = SerialPortOperator // | BleOperator

export interface IHwContext {
    provideSerialPortHelper?: () => SerialPortHelper
}

export async function findFirstSerialPort(operator: SerialPortOperator): Promise<SerialPortHelper | undefined> {
    const serialPorts = await SerialPort.list()
    const info = serialPorts.find(operator.isMatch)
    if (info && info.path) {
        return operator.createSerialPortHelper(info.path)
    }
    return undefined
}

/**
 * 시리얼 포트 헬퍼
 */
export class SerialPortHelper {
    private _sp: SerialPort
    private _parser: Stream.Transform | null = null
    private _data$ = new Subject<{ timestamp: number; data: Buffer }>()
    private _closed = true
    private _subscription: Subscription | null = null

    constructor(serialPort: SerialPort, parser?: Stream.Transform | null) {
        this._sp = serialPort
        this._parser = parser ?? null
        if (DEBUG) console.log('SerialPortHelper.create()')
    }

    /**
     * 시리얼 포트 헬퍼 생성
     * @param serialPort 시리얼 포트
     * @param parser 시리얼 포트 데이터 파서, 지정하지 않아도 됨
     * @returns SerialPortHelper 객체
     */
    static create = (serialPort: SerialPort, parser?: Stream.Transform | null): SerialPortHelper => {
        return new SerialPortHelper(serialPort, parser)
    }

    get path(): string | undefined {
        return this._sp?.path
    }

    get serialPort(): SerialPort {
        return this._sp
    }

    isReadable = (): boolean => {
        if (DEBUG) console.log('SerialPortHelper.isReadable()', this._sp && this._sp.readable)
        return this._sp && this._sp.readable
    }

    async write(values: number[]): Promise<void> {
        if (DEBUG) console.log('SerialPortHelper.write()', values)
        const succ = this._sp.write(Buffer.from(values))
        if (succ) return
        return new Promise((resolve, reject) => {
            console.log('drain')
            this._sp.drain((err) => {
                if (err) {
                    console.log(err.message)
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }

    async readNext(): Promise<Buffer> {
        return firstValueFrom(
            this.observeData().pipe(
                take(1),
                map((it) => it.data),
            ),
        )
    }

    async readFirst(predicate: (data: Buffer) => boolean): Promise<Buffer> {
        return firstValueFrom(
            this.observeData().pipe(
                filter((it) => predicate(it.data)),
                take(1),
                map((it) => it.data),
            ),
        )
    }

    private onClose = () => {
        if (this._closed) {
            if (DEBUG) console.log('SerialPortHelper.onClose() already closed')
            return
        }
        if (DEBUG) console.log('SerialPortHelper.onClose()')
        this._closed = true
        this._sp.off('open', this.onOpen)
        this._sp.off('close', this.onClose)
        this._sp.off('end', this.onEnd)
        this._sp.off('error', this.onError)

        this._subscription?.unsubscribe()
        this._subscription = null
        if (this._parser) {
            this._sp.unpipe(this._parser)
        }
        if (this._sp.isOpen) {
            this._sp.close()
        }
    }

    private onEnd = () => {
        if (DEBUG) console.log('SerialPortHelper.onEnd()')
        this._closed = true
    }

    private onError = (err) => {
        console.log('SerialPortHelper.onError()', err)
    }

    open = () => {
        if (DEBUG) console.log('SerialPortHelper.open()')
        this.onOpen()
    }

    private onOpen = () => {
        if (!this._closed) {
            if (DEBUG) console.log('SerialPortHelper.onOpen() already opened')
            return
        }
        if (DEBUG) console.log('SerialPortHelper.onOpen()')
        this._closed = false

        if (this._parser) {
            this._sp.pipe(this._parser)
        }
        this._sp.on('open', this.onOpen)
        this._sp.on('close', this.onClose)
        this._sp.on('end', this.onEnd)
        this._sp.on('error', this.onError)

        const source = this._parser ?? this._sp

        const src = new Observable<{ timestamp: number; data: Buffer }>((subscriber) => {
            const onData = (data: Buffer) => {
                if (DEBUG) console.log('SerialPortHelper.onData', data)
                subscriber.next({ timestamp: Date.now(), data })
            }
            const onClose = () => {
                subscriber.complete()
            }
            source.on('data', onData)
            source.once('close', onClose)
            return () => {
                console.log('data finished')
                source.off('data', onData)
                source.off('close', onClose)
            }
        })

        this._subscription = src
            .pipe(
                finalize(() => {
                    console.log('XXX finalize')
                }),
            )
            .subscribe({
                next: (data) => {
                    this._data$.next(data)
                },
                error: (err) => {
                    console.log('err:', err.message)
                },
                complete: () => {},
            })
    }

    close = () => {
        if (DEBUG) console.log('XXX _stopDataMonitor')
        this.onClose()
    }

    observeData = (): Observable<{ timestamp: number; data: Buffer }> => {
        const now = Date.now()
        const observable = this._data$.pipe(filter((it) => it.timestamp >= now))
        if (DEBUG) {
            return observable.pipe(
                tap((it) => {
                    if (DEBUG) console.log('SerialPortHelper.observeData(), next() = ', it)
                }),
            )
        } else {
            return observable
        }
    }
}
