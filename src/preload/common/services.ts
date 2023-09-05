import { createProxy } from 'src/electron-ipc-cat/client'
import { ContextServiceIPCDescriptor, IContextService } from 'src/services/context/IContextService'
import { HwServiceIPCDescriptor, IHwService } from 'src/services/hw/IHwService'
import { IMenuService, MenuServiceIPCDescriptor } from 'src/services/menu/interface'
import { INativeService, NativeServiceIPCDescriptor } from 'src/services/native/interface'
import { IPreferencesService, PreferenceServiceIPCDescriptor } from 'src/services/preferences/interface'
import { ISerialPortService, SerialPortServiceIPCDescriptor } from 'src/services/serialport/ISerialPortService'
import { IWindowService, WindowServiceIPCDescriptor } from 'src/services/windows/interface'

export const preferences = createProxy<IPreferencesService>(PreferenceServiceIPCDescriptor)
export const context = createProxy<IContextService>(ContextServiceIPCDescriptor)
export const serialPort = createProxy<ISerialPortService>(SerialPortServiceIPCDescriptor)
export const menu = createProxy<IMenuService>(MenuServiceIPCDescriptor)
export const window = createProxy<IWindowService>(WindowServiceIPCDescriptor)
export const hw = createProxy<IHwService>(HwServiceIPCDescriptor)
export const native = createProxy<INativeService>(NativeServiceIPCDescriptor)

export const descriptors = {
  preferences: PreferenceServiceIPCDescriptor,
  context: ContextServiceIPCDescriptor,
  serialPort: SerialPortServiceIPCDescriptor,
  window: WindowServiceIPCDescriptor,
  menu: MenuServiceIPCDescriptor,
  hw: HwServiceIPCDescriptor,
  native: NativeServiceIPCDescriptor,
}
