import { PortInfo } from '@serialport/bindings-interface'
import { injectable } from 'inversify'
import { SerialPort } from 'serialport'
import { logger } from '../../logger'
import { ISerialPortService } from './ISerialPortService'

const DEBUG = false

@injectable()
export class SerialPortService implements ISerialPortService {
  constructor() {}

  async list(): Promise<PortInfo[]> {
    const ports = await SerialPort.list()
    if (DEBUG) {
      logger.debug('SerialPort.list() = ', ports)
    }
    return ports
  }
}
