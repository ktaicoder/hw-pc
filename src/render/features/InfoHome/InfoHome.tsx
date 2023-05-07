import { Box, Paper, Tab, Tabs } from '@mui/material'
import { useState } from 'react'
import EnvInspectView from 'src/render/components/EnvInspectView'
import FolderInspectView from 'src/render/components/FolderInspectView'

export default function InfoHome() {
  const [tabIndex, setTabIndex] = useState(0)
  return (
    <>
      <Paper square>
        <Tabs value={tabIndex} onChange={(e, i) => setTabIndex(i)}>
          <Tab label="실행 환경" />
          <Tab label="폴더" />
        </Tabs>
      </Paper>

      <Box sx={{ mt: 2 }}>
        {tabIndex === 0 && <EnvInspectView />}
        {tabIndex === 1 && <FolderInspectView />}
      </Box>
    </>
  )
}
