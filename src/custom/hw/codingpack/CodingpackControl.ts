import SerialPort from 'serialport'
import { IHwContext, ISerialPortInfo, SerialPortHelper } from 'src/custom-types'
import { TerminalOutputTranslator } from 'src/custom-types/helper/TerminalOutputTranslator'
import { ICodingpackControl } from './ICodingpackControl'

const DEBUG = true

const chr = (ch: string): number => ch.charCodeAt(0)

/**
 * 하드웨어 제어
 * 코딩팩은 특수 동작을 하므로
 */
export class CodingpackControl implements ICodingpackControl {
    private _context: IHwContext | null = null

    /**
     * 하드웨어 컨텍스트
     * 프레임워크에서 Injection 해준다.
     * @param context
     */
    setContext = (context: IHwContext | undefined | null) => {
        this._context = context ?? null
    }

    /**
     * 시리얼포트 헬퍼 생성
     * 프레임워크에서 호출한다.
     * @param path 시리얼포트 패스(ex: COM1, /dev/ttyUSB0, ...)
     * @returns SerialPortHelper
     */
    static createSerialPortHelper = (path: string): SerialPortHelper => {
        const sp = new SerialPort(path, {
            autoOpen: false,
            baudRate: 115200,
            lock: true,
            parity: 'none',
        })

        // const parser = new InterByteTimeoutParser({ interval: 30 })
        const parser = new TerminalOutputTranslator()
        return SerialPortHelper.create(sp, parser)
    }

    /**
     * 시리얼포트를 처리할 수 있는지 체크
     * @param portInfo
     * @returns
     */
    static isMatch = (portInfo: ISerialPortInfo): boolean => {
        // console.log('XXX portInfo', portInfo)
        if (portInfo.manufacturer) {
            return portInfo.manufacturer.includes('wch.cn')
        }
        return false
    }

    private getSerialPortHelper(): SerialPortHelper | undefined {
        return this._context?.provideSerialPortHelper?.()
    }

    /**
     * @override IHwControl
     * @returns 읽기 가능 여부
     */
    isReadable = (): boolean => {
        const sp = this.getSerialPortHelper()
        return sp?.isReadable() === true
    }

    private checkSerialPort(): SerialPortHelper {
        if (!this.isReadable()) {
            throw new Error('hw not open')
        }
        return this.getSerialPortHelper()!
    }
}
