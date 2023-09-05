import { Box, Paper, Tab, Tabs } from '@mui/material'
import { useState } from 'react'
import SerialPortInspectView from 'src/render/components/SerialPortInspectView'

export default function InspectHome() {
  const [tabIndex, setTabIndex] = useState(0)
  return (
    <>
      <Paper square>
        <Tabs value={tabIndex} onChange={(_, i) => setTabIndex(i)}>
          <Tab label="시리얼포트" />
        </Tabs>
      </Paper>

      <Box sx={{ mt: 2 }}>{tabIndex === 0 && <SerialPortInspectView />}</Box>
    </>
  )
}
