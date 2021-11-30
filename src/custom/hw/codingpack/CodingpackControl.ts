import SerialPort, { parsers } from 'serialport'
import { IHwContext, SerialPortHelper, ISerialPortInfo } from 'src/custom-types'
import { InterByteTimeoutParser } from 'src/custom-types/helper/InterByteTimeoutParser'
import { TerminalOutputTranslator } from 'src/custom-types/helper/TerminalOutputTranslator'
import { ICodingpackControl } from './ICodingpackControl'

const DEBUG = true

const chr = (ch: string): number => ch.charCodeAt(0)

/**
 * 하드웨어 제어
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

    async readStream(): Promise<number[]> {
        const helper = this.checkSerialPort()
        const values = await helper.readNext()

        // [pin1 ~ pin5]
        return new Array(5).fill(0).map((_, i) => values[i] ?? 0)
    }

    async writeStream(input: string): Promise<void> {
        const helper = this.checkSerialPort()
        await helper.write(Buffer.from(input, 'utf8'))
    }
}
