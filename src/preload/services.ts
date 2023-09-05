import { createProxy } from 'src/electron-ipc-cat/client'
import { ContextServiceIPCDescriptor, IContextService } from 'src/services/context/IContextService'
import { HwServiceIPCDescriptor, IHwService } from 'src/services/hw/IHwService'
import { IMenuService, MenuServiceIPCDescriptor } from 'src/services/menu/IMenuService'
import { INativeService, NativeServiceIPCDescriptor } from 'src/services/native/INativeService'
import {
  IPreferencesService,
  PreferenceServiceIPCDescriptor,
} from 'src/services/preferences/IPreferencesService'
import {
  ISerialPortService,
  SerialPortServiceIPCDescriptor,
} from 'src/services/serialport/ISerialPortService'
import { IWindowService, WindowServiceIPCDescriptor } from 'src/services/windows/IWindowService'

export const context = createProxy<IContextService>(ContextServiceIPCDescriptor)
export const preferences = createProxy<IPreferencesService>(PreferenceServiceIPCDescriptor)
export const menu = createProxy<IMenuService>(MenuServiceIPCDescriptor)
export const window = createProxy<IWindowService>(WindowServiceIPCDescriptor)
export const native = createProxy<INativeService>(NativeServiceIPCDescriptor)
export const serialPort = createProxy<ISerialPortService>(SerialPortServiceIPCDescriptor)
export const hw = createProxy<IHwService>(HwServiceIPCDescriptor)

export const descriptors = {
  preferences: PreferenceServiceIPCDescriptor,
  context: ContextServiceIPCDescriptor,
  window: WindowServiceIPCDescriptor,
  menu: MenuServiceIPCDescriptor,
  native: NativeServiceIPCDescriptor,
  serialPort: SerialPortServiceIPCDescriptor,
  hw: HwServiceIPCDescriptor,
}
