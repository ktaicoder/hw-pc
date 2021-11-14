import { Box, Paper, Tab, Tabs } from '@mui/material'
import React, { useState } from 'react'
import EnvInspectView from './components/env-inspect/EnvInspectView'
import HidInspectView from './components/hid-inspect/HidInspectView'
import SerialPortInspectView from './components/serial-port-inspect/SerialPortInspectView'

type Props = {
    hw: 'serial' | 'hid'
}
export default function InspectView(props: Props) {
    const { hw } = props
    const [tabIndex, setTabIndex] = useState(0)
    return (
        <>
            <Paper square>
                <Tabs value={tabIndex} onChange={(e, i) => setTabIndex(i)}>
                    {hw === 'serial' && <Tab label="시리얼포트" />}
                    {hw === 'hid' && <Tab label="HID" />}
                    <Tab label="실행 환경" />
                </Tabs>
            </Paper>

            <Box sx={{ mt: 2 }}>
                {tabIndex === 0 && (hw === 'serial' ? <SerialPortInspectView /> : <HidInspectView />)}
                {tabIndex === 1 && <EnvInspectView />}
            </Box>
        </>
    )
}
