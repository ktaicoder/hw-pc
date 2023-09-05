import { BehaviorSubject, filter, Observable, of, switchMap, take, takeUntil } from 'rxjs'
import { DeviceOpenState, IDevice, IHw, ISerialDevice } from 'src/custom-types'
import { SerialDevice } from 'src/hw-server/serialport/SerialDevice'
import { SerialDeviceManager } from 'src/hw-server/serialport/SerialDeviceManager'
import { logger } from 'src/logger'
import { deviceStateManager } from 'src/services/hw/DeviceStateManager'
import { uiLogger } from 'src/services/hw/UiLogger'
import { AbstractHcpHwManager } from './AbstractHcpHwManager'
import { IHcpHwManager, IHcpHwNotificationManager } from './hcp-types'

export class HcpHwManager extends AbstractHcpHwManager implements IHcpHwManager {
  private readonly deviceManager_: SerialDeviceManager

  private readonly stopTrigger$ = new BehaviorSubject(false)

  readonly hwId: string

  constructor(options: { hw: IHw }) {
    super({
      hwControl: options.hw.createControl(),
    })
    this.hwId = options.hw.hwId
    this.deviceManager_ = new SerialDeviceManager(options.hw)
  }

  getHwId = (): string => this.hwId

  getDevice = (): ISerialDevice | null => {
    return this.deviceManager_.getSerialDevice()
  }

  observeDevice = (): Observable<ISerialDevice | null> => {
    return this.deviceManager_.observeDevice()
  }

  /**
   * device 연결 여부 관찰
   */
  observeOpenedOrNot = (): Observable<boolean> => {
    return this.deviceManager_.observeDevice().pipe(
      switchMap((device) => {
        if (!device) {
          return of(false)
        }
        return device.observeOpenedOrNot()
      }),
      takeUntil(this.stopTrigger$.pipe(filter((it) => it))),
    )
  }

  observeConnectedDevice = (): Observable<ISerialDevice> => {
    return this.deviceManager_.observeConnectedDevice()
  }

  getConnectedDevice = (): ISerialDevice | null => {
    return this.deviceManager_.getConnectedSerialDevice()
  }

  observeDeviceOpenState(): Observable<DeviceOpenState> {
    return this.deviceManager_.observeDeviceOpenState()
  }

  private onReadFromSerialDevice_ = (rxBytes: number) => {
    deviceStateManager.onRxOccured(rxBytes)
  }

  private onWriteToFromSerialDevice_ = (txBytes: number) => {
    deviceStateManager.onTxOccured(txBytes)
  }

  openDevice = async (params: any) => {
    const { portPath } = params as { portPath }
    if (!portPath) {
      uiLogger.w('HcpHwManager.openDevice() params invalid', JSON.stringify(params))
      logger.warn(`HcpHwManager.openDevice() params invalid: ${JSON.stringify(params)}`)
      throw new Error('invalid params')
    }

    this.stopTrigger$.next(false)
    const device = (await this.deviceManager_.open(portPath)) as SerialDevice
    device.setOnRead(this.onReadFromSerialDevice_)
    device.setOnWrite(this.onWriteToFromSerialDevice_)

    this.observeConnectedDevice()
      .pipe(take(1), takeUntil(this.stopTrigger$.pipe(filter((it) => it))))
      .subscribe((device) => {
        if (device.getSerialPortPath() !== portPath) {
          console.warn('이런 경우가 있을까?', device.getSerialPortPath(), portPath)
          uiLogger.w(
            'opened serialport is not matched:',
            JSON.stringify({
              requestPath: portPath,
              realPath: device.getSerialPortPath(),
            }),
          )
        }
        this.onDeviceOpened_(device)
      })
  }

  private onDeviceOpened_ = async (device: IDevice) => {
    try {
      // 시리얼포트를 닫기 전에, onDeviceWillClose()를 호출한다
      // 클라이언트의 연결이 끊어진 경우에도 호출된다
      await this.hwControl_.onDeviceOpened({ device })
    } catch (ignore) {
      console.log(ignore)
    }
  }

  private closeInternal_ = async (): Promise<void> => {
    const device = this.getDevice()
    if (!device) {
      return
    }

    if (device.getState() === 'closing' || device.getState() === 'closed') {
      return
    }

    uiLogger.i('HcpHwManager.close() ', device.getSerialPortPath() ?? '')
    try {
      // 시리얼포트를 닫기 전에, onDeviceWillClose()를 호출한다
      // 클라이언트의 연결이 끊어진 경우에도 호출된다
      await this.hwControl_.onDeviceWillClose({ device })
    } catch (ignore) {
      console.log(ignore)
    }
  }

  close = async (): Promise<void> => {
    await this.closeInternal_()
    await this.deviceManager_.close()
    this.stopTrigger$.next(true)
  }

  async onWebSocketDisconnected(): Promise<void> {
    const control = this.hwControl_
    const device = this.getConnectedDevice()
    if (device) {
      await control.onWebSocketDisconnected({ device })
    }
  }

  async onWebSocketConnected(options: {
    device: IDevice
    notificationManager: IHcpHwNotificationManager
  }): Promise<void> {
    const { device, notificationManager } = options
    const control = this.hwControl_

    // 하드웨어에 웹소켓이 연결되었음을 알림
    await control.onWebSocketConnected({ device, notificationManager })
  }
}
