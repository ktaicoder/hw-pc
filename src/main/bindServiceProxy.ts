import 'reflect-metadata'
/**
 * Don't forget to edit src/preload/common/services.ts to export service to renderer process
 */
import { ProxyDescriptor, registerProxy } from 'src/electron-ipc-cat/server'
import { ContextService } from 'src/services/context'
import { ContextServiceIPCDescriptor, IContextService } from 'src/services/context/IContextService'
import { HwService } from 'src/services/hw'
import { HwServiceIPCDescriptor, IHwService } from 'src/services/hw/IHwService'
import { MenuService } from 'src/services/menu'
import { IMenuService, MenuServiceIPCDescriptor } from 'src/services/menu/interface'
import { NativeService } from 'src/services/native'
import { INativeService, NativeServiceIPCDescriptor } from 'src/services/native/interface'
import { PreferencesService } from 'src/services/preferences'
import { IPreferencesService, PreferenceServiceIPCDescriptor } from 'src/services/preferences/interface'
import { SerialPortService } from 'src/services/serialport'
import { ISerialPortService, SerialPortServiceIPCDescriptor } from 'src/services/serialport/ISerialPortService'
import { WindowService } from 'src/services/windows'
import { IWindowService, WindowServiceIPCDescriptor } from 'src/services/windows/interface'
import { container } from '../services/container'
import serviceIdentifier from '../services/serviceIdentifier'

function bind<SERVICE>(
  constructor: new (...args: any[]) => SERVICE,
  descriptor: ProxyDescriptor,
  serviceId: string | symbol,
) {
  container.bind<SERVICE>(serviceId).to(constructor).inSingletonScope()
  const service = container.get<SERVICE>(serviceId)
  registerProxy(service, descriptor)
}

/**
 * 주의할 점
 * WindowService에서 PreferencesService 를 사용하므로
 * PreferencesService를 WindowService보다 먼저 바인딩해야 한다
 */
export function bindServiceProxy(): void {
  bind<IPreferencesService>(PreferencesService, PreferenceServiceIPCDescriptor, serviceIdentifier.Preferences)
  bind<IContextService>(ContextService, ContextServiceIPCDescriptor, serviceIdentifier.Context)
  bind<ISerialPortService>(SerialPortService, SerialPortServiceIPCDescriptor, serviceIdentifier.SerialPort)
  bind<IMenuService>(MenuService, MenuServiceIPCDescriptor, serviceIdentifier.Menu)
  bind<IWindowService>(WindowService, WindowServiceIPCDescriptor, serviceIdentifier.Window)
  bind<IHwService>(HwService, HwServiceIPCDescriptor, serviceIdentifier.Hw)
  bind<INativeService>(NativeService, NativeServiceIPCDescriptor, serviceIdentifier.Native)
}
