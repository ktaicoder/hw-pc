import 'reflect-metadata'
/**
 * Don't forget to edit src/preload/common/services.ts to export service to renderer process
 */
import { registerProxy, ProxyDescriptor } from 'src/electron-ipc-cat/server'
import serviceIdentifier from '../services/serviceIdentifier'
import { container } from '../services/container'
import { PreferencesService } from 'src/services/preferences'
import { ContextService } from 'src/services/context'
import { SerialPortService } from 'src/services/serialport'
import { HidService } from 'src/services/hid'
import { WindowService } from 'src/services/windows'
import { MenuService } from 'src/services/menu'
import { HwService } from 'src/services/hw'
import { IPreferencesService, PreferenceServiceIPCDescriptor } from 'src/services/preferences/interface'
import { IContextService, ContextServiceIPCDescriptor } from 'src/services/context/interface'
import { ISerialPortService, SerialPortServiceIPCDescriptor } from 'src/services/serialport/interface'
import { HidServiceIPCDescriptor, IHidService } from 'src/services/hid/interface'
import { IWindowService, WindowServiceIPCDescriptor } from 'src/services/windows/interface'
import { IMenuService, MenuServiceIPCDescriptor } from 'src/services/menu/interface'
import { IHwService, HwServiceIPCDescriptor } from 'src/services/hw/interface'
import { INativeService, NativeServiceIPCDescriptor } from 'src/services/native/interface'
import { NativeService } from 'src/services/native'

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
    bind<IHidService>(HidService, HidServiceIPCDescriptor, serviceIdentifier.Hid)
    bind<IMenuService>(MenuService, MenuServiceIPCDescriptor, serviceIdentifier.Menu)
    bind<IWindowService>(WindowService, WindowServiceIPCDescriptor, serviceIdentifier.Window)
    bind<IHwService>(HwService, HwServiceIPCDescriptor, serviceIdentifier.Hw)
    bind<INativeService>(NativeService, NativeServiceIPCDescriptor, serviceIdentifier.Native)
}
