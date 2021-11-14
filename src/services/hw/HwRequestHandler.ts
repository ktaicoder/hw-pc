import { Socket } from 'socket.io/dist'
import { IHwCmdRequest, IHwControl } from 'src/custom-types/hw-types'
import { IHwContext, SerialPortHelper } from 'src/custom/serial-port'
import { HwRegistry } from './HwRegistry'

const DEBUG = true
const DEVICE_CTL_REQUEST_V2 = 'deviceCtlMsg_v2:request'
const DEVICE_CTL_RESPONSE_V2 = 'deviceCtlMsg_v2:response'

function sendError(socket: Socket, requestId: string, err: any) {
    console.log(err)
    if (socket.connected) {
        socket.send({ requestId, success: false, error: err.message })
    } else {
        console.log('cannot response, because web socket disconnect')
    }
}

export type DisposeFn = () => void
export type CommandHandlerFn = () => Promise<any>

export type DeviceControlRequest = {
    type: 'deviceCtl'
    body: IHwCmdRequest
}

export type WebSocketRequestPayload = DeviceControlRequest

class SerialPortHolder {
    private _info: { helper: SerialPortHelper; hwId: string } | undefined = undefined

    get hwId(): string | undefined {
        return this._info?.hwId
    }

    get helper(): SerialPortHelper | undefined {
        return this._info?.helper
    }

    getOrCreate = async (hwId: string, serialPortPath: string): Promise<SerialPortHelper | undefined> => {
        if (this._info) {
            if (this._info.hwId == hwId && this._info.helper.path === serialPortPath) {
                return this._info.helper
            }
            console.log('serialport path changed, force close()')
            this.remove()
        }

        const { operator } = HwRegistry.find(hwId) ?? {}
        if (!operator) {
            throw new Error('unknown hwId:' + hwId)
        }

        let helper = operator.createSerialPortHelper!(serialPortPath)
        if (!helper) {
            console.log('cannot find serialport for path:', serialPortPath)
            return undefined
        }

        if (helper) {
            console.log(`serialport opened(${hwId}, ${serialPortPath})`)
            helper.open()
            this._info = { hwId, helper }
        }

        return helper
    }

    remove = () => {
        if (this._info) {
            const { helper, hwId } = this._info
            const path = helper.path
            try {
                helper.close()
            } catch (err) {}

            console.log('serialport closeed', path)
            this._info = undefined
        }
    }
}

export class HwControlManager {
    private _serialPortHolder = new SerialPortHolder()
    private _hwIdHints = new Set<string>()

    closeResources = () => {
        this._serialPortHolder.remove()
        this._hwIdHints.forEach(this._clearContext)
        this._hwIdHints.clear()
    }

    getSerialPortHelper = (hwId: string): SerialPortHelper | undefined => {
        if (this._serialPortHolder.hwId == hwId) {
            return this._serialPortHolder.helper
        }
        return undefined
    }

    // setupSerialPort = async (hwId: string, serialPortPath: string): Promise<IHwControl | undefined> => {
    //     const { control: ctl, info } = HW_REGISTRY[hwId]
    //     if (!ctl || !info) {
    //         console.log(`ignore, unknown hardware: ${hwId}`)
    //         return undefined
    //     }
    //     await this._injectHwContext(hwId, serialPortPath, info, ctl)
    //     return ctl
    // }

    isHwReady = (hwId: string): boolean => {
        const { control } = HwRegistry.find(hwId) ?? {}
        if (!control) return false
        return control.isReadable()
    }

    private _clearContext = (hwId: string) => {
        const { control } = HwRegistry.find(hwId) ?? {}
        if (!control) return false
        control.setContext(undefined)
    }

    prepareSerialPort = async (hwId: string, serialPortPath: string): Promise<SerialPortHelper | undefined> => {
        const { control: ctl, info } = HwRegistry.find(hwId) ?? {}
        if (!ctl || !info) {
            console.log(`ignore, unknown hardware: ${hwId}`)
            throw new Error('unknown hwId:' + hwId)
        }
        return await this._serialPortHolder.getOrCreate(hwId, serialPortPath)
    }

    private _createSerialPortControl = async (hwId: string, serialPortPath: string): Promise<IHwControl> => {
        const { control: ctl, info } = HwRegistry.find(hwId) ?? {}
        if (!ctl || !info) {
            console.log(`ignore, unknown hardware: ${hwId}`)
            throw new Error('unknown hwId:' + hwId)
        }

        const ctx: IHwContext = {}
        if (info.hwKind === 'serial') {
            const sp = await this._serialPortHolder.getOrCreate(hwId, serialPortPath)
            if (sp) {
                this._hwIdHints.add(hwId)
                ctx.provideSerialPortHelper = () => sp
            }
        }
        ctl.setContext(ctx)
        return ctl
    }

    // injectHwContext = async (hwId: string): Promise<IHwControl | undefined> => {
    //     const { control: ctl, info } = HW_REGISTRY[hwId]
    //     if (!ctl || !info) {
    //         console.log(`ignore, unknown hardware: ${hwId}`)
    //         return undefined
    //     }

    //     const ctx: IHwContext = {}
    //     if (info.hwKind === 'serial') {
    //         const sp = await this._serialPortHolder.getOrCreate(hwId, serialPortPath)
    //         if (sp) {
    //             this._hwIdHints.add(hwId)
    //             ctx.provideSerialPortHelper = () => sp
    //         }
    //     }
    //     ctl.setContext(ctx)
    //     return ctl
    // }

    createSerialPortRequestHandler = async (hwId: string, serialPortPath: string): Promise<HwRequestHandler> => {
        const ctx = await this._createSerialPortControl(hwId, serialPortPath)!
        return new HwRequestHandler(this, hwId, ctx)
    }
}

export class HwRequestHandler {
    constructor(public controlManager: HwControlManager, public hwId: string, public control: IHwControl) {}

    handle = async (sock: Socket, message: any) => {
        const { requestId, clientMeta, hwId, cmd, args } = message
        if (!hwId) {
            sendError(sock, requestId, new Error('invalid packet:' + JSON.stringify({ hwId, requestId, cmd })))
            return
        }

        if (hwId !== this.hwId) {
            sendError(sock, requestId, new Error('mismatch hwId:' + this.hwId + ',' + hwId))
            return
        }

        const fn = this.control[cmd]
        if (!fn) {
            console.log(`ignore, unknown cmd: ${hwId}.${cmd}`, { requestId, hwId, cmd, args })
            sendError(sock, requestId, new Error(`unknown cmd: ${hwId}.${cmd}`))
            return
        }

        fn.apply(this.control, args)
            .then((result) => {
                let resultFrame
                if (typeof result === 'undefined' || result === null) {
                    resultFrame = { requestId, success: true }
                } else {
                    resultFrame = { requestId, success: true, body: result }
                }
                sock.emit(DEVICE_CTL_RESPONSE_V2, resultFrame)
            })
            .catch((err) => {
                sendError(sock, requestId, err)
            })
    }
}

// export class HwControls {
//     private _registry: Record<string, { info: IHwInfo; operator: HwOperator; control: any }> = {}
//     private _controlManager = new HwControlManager()
//     private _serialPort: SerialPort | undefined = undefined
//     private _hwId: string | undefined = undefined

//     get hwId(): string | undefined {
//         return this._hwId
//     }

//     closeResources = () => {
//         this._controlManager.closeResources()
//     }

//     _ensureSerialPortHelper = async (hwId: string): Promise<SerialPortHelper | undefined> => {
//         const sp = await this._serialPortStore.getOrCreate(hwId)
//         if (!sp) {
//             console.warn('_createSerialPort fail for hwId = ', hwId)
//         } else {
//             if (DEBUG) console.warn('_createSerialPort success hwId = ', hwId)
//         }

//         return sp
//     }

//     isOpen = (): boolean => {
//         return this._serialPort?.isOpen === true
//     }

//     get serialPort(): SerialPort | undefined {
//         return this._serialPort
//     }

//     startHw(hwId: string, serialPort: SerialPort) {
//         console.log(`startHwId(hwId=${hwId}, path=${serialPort.path})`)
//         this._hwId = hwId
//         this._serialPort = serialPort
//     }

//     stopHw() {
//         console.log(`stopHw(hwId=${this._hwId})`)
//         this.closeSerialPort()
//         this._hwId = undefined
//     }

//     private closeSerialPort = () => {
//         if (this._serialPort && this._serialPort.isOpen) {
//             try {
//                 this._serialPort.close((err) => {
//                     console.log(err)
//                 })
//             } catch (ignore: any) {}
//         }
//         this._serialPort = undefined
//     }

//     isInitialized = () => {
//         return Object.keys(this._registry).length > 0
//     }

//     registerHw = (hwId: string, info: IHwInfo, operator: HwOperator, control: any) => {
//         this._registry[hwId] = { info, operator, control }
//     }

//     createSerialPort = async (hwId: string): Promise<SerialPortHelper | undefined> => {
//         const operator = this._registry[hwId]?.operator
//         if (!operator) return undefined
//         return await findFirstSerialPort(operator)
//     }

//     private _ensureSerialPort = async (): Promise<SerialPort | undefined> => {
//         const hwId = this._hwId
//         if (!hwId) {
//             console.warn('cannot start hw controls')
//             return
//         }

//         if (typeof this._serialPort === 'undefined') {
//             const operator = this._registry[hwId]?.operator
//             if (!operator) return undefined
//             this._serialPort = await this.createSerialPort(hwId)
//         }

//         return this._serialPort!
//     }

//     onNewClientSocket = (socket: WebSocket): DisposeFn => {
//         const handleMsg = (bufferData: Buffer) => {
//             const payload = JSON.parse(bufferData.toString())
//             console.log('payload=', { payload })
//             if (payload.type === 'deviceCtl') {
//                 this._handleRequest(socket, payload.body)
//             }
//         }

//         const handleClose = (code: number, reason: Buffer) => {
//             console.log('onClose', { code, reason })
//         }

//         socket.on('message', handleMsg)
//         socket.on('close', handleClose)
//         //socket.on('hw-control', handlerFn)

//         return () => {
//             console.log(`dispose client socket`)
//             socket.off('message', handleMsg)
//             socket.off('close', handleClose)
//         }
//     }

//     private _handleRequest = (socket: WebSocket, request: IHwCmdRequest) => {
//         console.log('_handleRequest request =', { request })
//         const { requestId, clientMeta, hwId, cmd, args } = request
//         if (typeof requestId !== 'string' || typeof hwId !== 'string' || typeof cmd !== 'string') {
//             console.warn('unknown request', request)
//             return
//         }

//         this._handleCommand(socket, requestId, hwId, cmd, args)
//     }

//     private _handleCommand = async (
//         socket: WebSocket,
//         requestId: string,
//         hwId: string,
//         cmd: string,
//         args: unknown[],
//     ) => {
//         if (hwId !== this._hwId) {
//             console.log(`invalid hwId: ${hwId}, current hwId = ${this._hwId}`)
//             return
//         }
//         const { control: ctl, info } = this._registry[hwId] ?? {}
//         if (!ctl || !info) {
//             console.log(`ignore, unknown hardware: ${hwId}`, { requestId, hwId, cmd, args })
//             return
//         }

//         // 요청이 왔을때 연결한다
//         if (info.hwKind === HwKind.serial) {
//             try {
//                 this._ensureSerialPort()
//             } catch (err: any) {
//                 logger.debug(err)
//                 return
//             }
//             if (!ctl.serialPort) {
//                 ctl.serialPort = this._serialPort
//             }
//         }

//         const fnName = cmd
//         let fn = ctl[fnName]
//         if (!(fn instanceof Function)) {
//             console.log(`cannot resolve action function ${fnName}() on ${JSON.stringify(ctl)}`, {
//                 requestId,
//                 hwId,
//                 cmd,
//                 args,
//             })
//             return
//         }

//         fn = fn as CommandHandlerFn
//         if (DEBUG) console.log('XXX args=', { args })
//         fn.apply(ctl, args)
//             .then((result: any) => {
//                 let resultFrame: any
//                 if (typeof result === 'undefined' || result === null) {
//                     resultFrame = { type: 'channel', channel: requestId, success: true }
//                 } else {
//                     resultFrame = { type: 'channel', channel: requestId, success: true, body: result }
//                 }
//                 socket.send(JSON.stringify(resultFrame))
//             })
//             .catch((err: any) => {
//                 console.log(err)
//                 if (socket.readyState === WebSocket.OPEN) {
//                     socket.send({ type: 'channel', channel: requestId, success: false, error: err.message })
//                 } else {
//                     console.log('cannot response, because web socket disconnect')
//                 }
//             })
//     }
// }
