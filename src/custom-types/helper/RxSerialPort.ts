import { Observable } from 'rxjs'
import SerialPort from 'serialport'

/**
 * 현재 미사용
 */
export class RxSerialPort {
    static fromConnectEvent = (sp: SerialPort) => {
        return new Observable((emit) => {
            const handle = () => {
                emit.next()
            }
            sp.on('connect', handle)
            return () => {
                sp.off('connect', handle)
            }
        })
    }

    static fromCloseEvent = (sp: SerialPort) => {
        return new Observable((emit) => {
            const handle = () => {
                emit.next()
            }
            sp.on('close', handle)
            return () => {
                sp.off('close', handle)
            }
        })
    }

    static fromEndEvent = (sp: SerialPort) => {
        return new Observable((emit) => {
            const handle = () => {
                emit.next()
            }
            sp.on('end', handle)
            return () => {
                sp.off('end', handle)
            }
        })
    }

    static fromErrorEvent = (sp: SerialPort) => {
        return new Observable((emit) => {
            const handle = (err) => {
                emit.next(err)
            }
            sp.on('error', handle)
            return () => {
                sp.off('error', handle)
            }
        })
    }
}
