import { PortInfo } from '@serialport/bindings-interface'
import { injectable } from 'inversify'
import { SerialPort } from 'serialport'
import { ISerialPortService } from './ISerialPortService'
import { logger } from 'src/logger'

const DEBUG = false

@injectable()
export class SerialPortService implements ISerialPortService {
  async list(): Promise<PortInfo[]> {
    const ports = await SerialPort.list()
    if (DEBUG) {
      logger.debug('SerialPort.list() = ', ports)
    }
    return ports
  }
}
