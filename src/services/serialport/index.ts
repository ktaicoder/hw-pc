import { injectable } from 'inversify'
import SerialPort from 'serialport'
import { logger } from '../libs/log'
import { ISerialPortService } from './interface'
const DEBUG = true

@injectable()
export class SerialPortService implements ISerialPortService {
    constructor() {}

    async list(): Promise<SerialPort.PortInfo[]> {
        const ports = await SerialPort.list()
        if (DEBUG)
            logger.debug(
                'SerialPort.list() = ',
                ports.map((it) => it.path),
            )
        return ports
    }
}
