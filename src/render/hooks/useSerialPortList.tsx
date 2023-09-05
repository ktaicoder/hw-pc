import { useCallback, useEffect, useState } from 'react'
import { interval } from 'rxjs'
import { ISerialPortInfo } from 'src/custom-types/basic-types'

const isEqualPort = (p1: ISerialPortInfo, p2: ISerialPortInfo): boolean => {
  return (
    p1.path === p2.path &&
    p1.manufacturer === p2.manufacturer &&
    p1.serialNumber === p2.serialNumber &&
    p1.pnpId === p2.pnpId &&
    p1.locationId === p2.locationId &&
    p1.productId === p2.productId &&
    p1.vendorId === p2.vendorId &&
    p1.friendlyName === p2.friendlyName
  )
}

const isEqualPorts = (array1: ISerialPortInfo[], array2: ISerialPortInfo[]) => {
  if (array1.length !== array2.length) {
    return false
  }

  for (let i = 0; i < array1.length; i++) {
    if (!isEqualPort(array1[i], array2[i])) {
      return false
    }
  }
  return true
}

export default function useSerialPortList(hwId: string, refreshToken: number): ISerialPortInfo[] {
  const [portInfos, setPortInfos] = useState<ISerialPortInfo[]>([])

  const portCheckInterval = portInfos.length === 0 ? 5000 : 7000

  const loadPorts = useCallback(async (hwId: string): Promise<void> => {
    const ports = (await window.service.hw.serialPortList(hwId)) ?? []
    setPortInfos((prev) => {
      return isEqualPorts(prev, ports) ? prev : ports
    })
  }, [])

  useEffect(() => {
    const s1 = interval(portCheckInterval).subscribe(() => {
      loadPorts(hwId)
    })
    return () => {
      s1.unsubscribe()
    }
  }, [hwId, loadPorts, portCheckInterval])

  useEffect(() => {
    loadPorts(hwId)
  }, [refreshToken, loadPorts, hwId])

  return portInfos
}
