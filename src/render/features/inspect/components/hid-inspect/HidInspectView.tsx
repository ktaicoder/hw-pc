import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { Device } from 'node-hid'
import Portlet from 'src/render/components/Portlet'
import PortletContent from 'src/render/components/PortletContent'
import PortletHeader from 'src/render/components/PortletHeader'
import PortletLabel from 'src/render/components/PortletLabel'
import { usePromiseValue } from 'src/render/util/useServiceValue'
import UsbIcon from '@mui/icons-material/Usb'
import { useCallback, useEffect } from 'react'
export default function HidInspectView() {
    const deviceList = usePromiseValue<Device[]>(async () => await window.service.hid.devices(), [])

    return (
        <Portlet>
            <PortletHeader>
                <PortletLabel title="HID 장치" icon={<UsbIcon />} />
            </PortletHeader>
            <PortletContent>
                {/* <pre>{JSON.stringify(deviceList, null, 4)}</pre> */}
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Product Id</TableCell>
                                <TableCell>Vendor Id</TableCell>
                                <TableCell>제조사</TableCell>
                                <TableCell>Path</TableCell>
                                <TableCell>인터페이스</TableCell>
                                <TableCell>Release</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {deviceList?.map((device) => (
                                <TableRow key={device.path}>
                                    <TableCell>0x{device.productId?.toString(16)}</TableCell>
                                    <TableCell>0x{device.vendorId?.toString(16)}</TableCell>
                                    <TableCell>
                                        <Typography>{device.manufacturer}</Typography>
                                        {device.product !== device.manufacturer && (
                                            <Typography>{device.product}</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{device.path}</Typography>
                                    </TableCell>
                                    <TableCell>{device.interface}</TableCell>
                                    <TableCell>{device.release}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </PortletContent>
        </Portlet>
    )
}
