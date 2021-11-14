import { injectable } from 'inversify'
import SerialPort from 'serialport'
import { logger } from '../libs/log'
import { ISerialPortService } from './interface'

@injectable()
export class SerialPortService implements ISerialPortService {
    constructor() {}

    async list(): Promise<SerialPort.PortInfo[]> {
        const ports = await SerialPort.list()
        logger.warn('SerialPort.list() = ', { ports })
        return ports
    }
}
