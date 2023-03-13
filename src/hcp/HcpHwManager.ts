import { BehaviorSubject, filter, Observable, take, takeUntil } from 'rxjs'
import { IHwControl, IHwDescriptor, ISerialDevice, IUiLogger } from 'src/custom-types'
import { SerialDeviceManager } from 'src/hw-server/serialport/SerialDeviceManager'

export class HcpHwManager {
  private readonly deviceManager_: SerialDeviceManager

  private readonly hwControl_: IHwControl

  private readonly stopTrigger$ = new BehaviorSubject(false)

  constructor(
    public readonly hwDescriptor: IHwDescriptor, //
    private readonly uiLogger: IUiLogger,
  ) {
    this.deviceManager_ = new SerialDeviceManager(hwDescriptor.hw, uiLogger)
    this.hwControl_ = hwDescriptor.hw.createControl()
  }

  getHwId = (): string => this.hwDescriptor.hwId

  getDevice = (): ISerialDevice | null => {
    return this.deviceManager_.getSerialDevice()
  }

  observeDevice = (): Observable<ISerialDevice | null> => {
    return this.deviceManager_.observeDevice()
  }

  observeConnectedDevice = (): Observable<ISerialDevice> => {
    return this.deviceManager_.observeConnectedDevice()
  }

  getConnectedDevice = (): ISerialDevice | null => {
    return this.deviceManager_.getConnectedSerialDevice()
  }

  openSerialPort = async (path: string) => {
    this.stopTrigger$.next(false)
    await this.deviceManager_.open(path)
    this.observeConnectedDevice()
      .pipe(take(1), takeUntil(this.stopTrigger$.pipe(filter((it) => it))))
      .subscribe((device) => {
        if (device.getSerialPortPath() !== path) {
          console.warn('이런 경우가 있을까?', device.getSerialPortPath(), path)
          this.uiLogger.w(
            'opened serialport is not matched:',
            JSON.stringify({
              requestPath: path,
              realPath: device.getSerialPortPath(),
            }),
          )
        }
        this.onDeviceOpened_(device)
      })
  }

  private onDeviceOpened_ = async (device: ISerialDevice) => {
    try {
      // 시리얼포트를 닫기 전에, onDeviceWillClose()를 호출한다
      // 클라이언트의 연결이 끊어진 경우에도 호출된다
      await this.hwControl_.onDeviceOpened({ device, uiLogger: this.uiLogger })
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

    this.uiLogger.i('HcpHwManager.close() ', device.getSerialPortPath() ?? '')
    try {
      // 시리얼포트를 닫기 전에, onDeviceWillClose()를 호출한다
      // 클라이언트의 연결이 끊어진 경우에도 호출된다
      await this.hwControl_.onDeviceWillClose({ device, uiLogger: this.uiLogger })
    } catch (ignore) {
      console.log(ignore)
    }
  }

  close = async (): Promise<void> => {
    await this.closeInternal_()
    await this.deviceManager_.close()
    this.stopTrigger$.next(true)
  }

  getHwControl = (): IHwControl => {
    return this.hwControl_
  }
}
