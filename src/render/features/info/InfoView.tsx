import { Box, Paper, Tab, Tabs } from '@mui/material'
import React, { useState } from 'react'
import EnvInspectView from '../inspect/components/env-inspect/EnvInspectView'

export default function InfoView() {
    const [tabIndex, setTabIndex] = useState(0)
    return (
        <>
            <Paper square>
                <Tabs value={tabIndex} onChange={(e, i) => setTabIndex(i)}>
                    <Tab label="실행 환경" />
                </Tabs>
            </Paper>

            <Box sx={{ mt: 2 }}>{tabIndex === 0 && <EnvInspectView />}</Box>
        </>
    )
}
