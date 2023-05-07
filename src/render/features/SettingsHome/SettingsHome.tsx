import { Box, Paper, Tab, Tabs } from '@mui/material'
import { useState } from 'react'
import EnvInspectView from 'src/render/components/EnvInspectView'

export default function SettingsView() {
  const [tabIndex, setTabIndex] = useState(0)
  return (
    <>
      <Paper square>
        <Tabs value={tabIndex} onChange={(e, i) => setTabIndex(i)}>
          <Tab label="설정" />
        </Tabs>
      </Paper>

      <Box sx={{ mt: 2 }}>{tabIndex === 0 && <EnvInspectView />}</Box>
    </>
  )
}
