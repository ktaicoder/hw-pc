import KeyboardDoubleArrowLeftRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowLeftRounded'
import KeyboardDoubleArrowRightRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowRightRounded'
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { useUnmount } from 'react-use'
import { firstValueFrom, interval } from 'rxjs'
import { CodingpackActionKindKey } from 'src/domain/codingpack'
import CustomTableBody from 'src/render/components/CustomTableBody'
import Portlet from 'src/render/components/Portlet'
import PortletContent from 'src/render/components/PortletContent'
import PortletHeader from 'src/render/components/PortletHeader'
import { CodingpackActions } from 'src/render/features/codingpack/codingpack-actions'
import { CodingpackInfo, HwClient } from '../socket/HwClient'

type RunningCallbackFn = (running: boolean) => void

type Props = {
  hwClient: HwClient
  onRunning: RunningCallbackFn
  minimized: boolean
  toggleMinimize: () => void
}

const ACTION_KIND: CodingpackActionKindKey = 'inspect'

export default function CodingpackInspectView(props: Props) {
  const { hwClient, minimized, toggleMinimize } = props
  const runContextRef = useRef({ canceled: false })
  const actionData = useMemo(() => CodingpackActions.find((it) => it.kind === ACTION_KIND)!, [])
  const [loading, setScanning] = useState(false)
  const [info, setInfo] = useState<CodingpackInfo>()

  const doRunInspect = useCallback(async () => {
    setScanning(true)
    try {
      const info = await firstValueFrom(hwClient.runInspect())
      console.log(info)
      if (info !== null) {
        setInfo(info)
      } else {
        toast.warn('오류가 발생했습니다')
      }
    } catch (err) {
      toast.warn('오류가 발생했습니다:' + err.message)
    } finally {
      setScanning(false)
    }
  }, [hwClient])

  useEffect(() => {
    doRunInspect()
  }, [doRunInspect])

  useUnmount(() => {
    runContextRef.current.canceled = true
  })

  return (
    <Box
      sx={{
        px: 3,
        pt: 0,
        pb: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: '450px',
        justifyContent: 'center',
        '& em': {
          fontStyle: 'normal',
          color: 'secondary',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          p: 1.5,
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="subtitle1" sx={{ ml: 1, fontSize: '1.2rem', fontWeight: 700 }}>
          {actionData.title}
        </Typography>
      </Box>

      <IconButton
        onClick={() => toggleMinimize()}
        sx={{
          position: 'absolute',
          top: 0,
          ...(minimized && {
            left: 0,
          }),
          ...(!minimized && {
            right: 0,
          }),
        }}
      >
        {minimized ? <KeyboardDoubleArrowLeftRoundedIcon color="error" /> : <KeyboardDoubleArrowRightRoundedIcon />}
      </IconButton>
      {!info && (
        <Box sx={{ fontSize: '0.85rem', mt: 1, textAlign: 'center', color: 'primary.main' }}>{actionData.subtitle}</Box>
      )}

      <Box
        sx={{
          fontSize: '0.85rem',
          mt: 0.5,
          width: '100%',
          textAlign: 'center',
          '& > div:nth-child(1)': {
            color: 'primary.main',
            fontSize: '0.85rem',
            fontWeight: 600,
          },
          '& > div:nth-child(2)': {
            color: '#444',
            fontSize: '0.75rem',
            fontWeight: 400,
          },
        }}
      >
        <div>{info?.model}</div>
        <div>{info?.modelType === 'rp3' ? '라즈베리파이 3' : info?.modelType === 'rp4' ? '라즈베리파이 4' : '-'}</div>
      </Box>
      {info && (
        <Box
          sx={{
            width: '100%',
            mt: 2,
            fontSize: '0.85rem',
            '& > span:nth-child(1)': {
              color: 'primary.main',
              minWidth: 64,
              display: 'inline-block',
            },
            '& > span:nth-child(2)': {
              color: '#191919',
              ml: 1,
            },
            '& > span:nth-child(3)': {
              color: '#191919',
              display: 'block',
              ml: '72px',
            },
            '& > span:nth-child(4)': {
              color: '#666',
              display: 'block',
              fontSize: '0.75rem',
              ml: '72px',
            },
            '& > span:nth-child(5)': {
              color: '#666',
              display: 'block',
              fontSize: '0.75rem',
              ml: '72px',
            },
          }}
        >
          <span>CPU</span>
          <span>
            {info?.cpuMHz} MHz , {info?.cpuCount}개
          </span>
          <span>
            {info?.cpuArch} ({info?.cpuArchModel}){' '}
          </span>
          <span>{info?.cpuModel}</span>
          <span>{info?.cpuHardware}</span>
        </Box>
      )}
      {info && (
        <Box
          sx={{
            width: '100%',
            mt: 2,
            fontSize: '0.85rem',
            '& > span:nth-child(1)': {
              color: 'primary.main',
              minWidth: 64,
              display: 'inline-block',
            },
            '& > span:nth-child(2)': {
              color: '#191919',
              ml: 1,
            },
          }}
        >
          <span>메모리</span>
          <span>{info?.memTotal}</span>
        </Box>
      )}

      {info?.networkInterfaces && (
        <Table
          sx={{
            width: '100%',
            '& th': {
              py: 1,
              px: 2,
            },
            border: '1px solid #ddd',
            mt: 2,
            opacity: loading ? 0.5 : 1,
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>네트워크</TableCell>
              <TableCell>IP</TableCell>
              <TableCell>연결</TableCell>
              <TableCell>MAC</TableCell>
            </TableRow>
          </TableHead>

          <CustomTableBody>
            {info.networkInterfaces.map((it) => (
              <TableRow key={it.iface}>
                <TableCell>{it.iface}</TableCell>
                <TableCell>{it.ip ?? '-'}</TableCell>
                <TableCell>{it.connection ?? '-'}</TableCell>
                <TableCell>{it.mac}</TableCell>
              </TableRow>
            ))}
          </CustomTableBody>
        </Table>
      )}

      {info?.disk && (
        <Table
          sx={{
            width: '100%',
            '& th': {
              py: 1,
              px: 2,
            },
            border: '1px solid #ddd',
            mt: 2,
            opacity: loading ? 0.5 : 1,
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>SD카드</TableCell>
              <TableCell>사용</TableCell>
              <TableCell>남은 크기</TableCell>
            </TableRow>
          </TableHead>

          <CustomTableBody>
            <TableRow>
              <TableCell>{info.disk.total}</TableCell>
              <TableCell>
                {info.disk.used} ( {info.disk.usedPercent} )
              </TableCell>
              <TableCell>{info.disk.avail}</TableCell>
            </TableRow>
          </CustomTableBody>
        </Table>
      )}

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {loading && <CircularProgress size="1rem" />}
        {!loading && (
          <Button variant="outlined" disabled={loading} onClick={() => doRunInspect()} color="primary">
            새로고침
          </Button>
        )}
      </Box>
    </Box>
  )
}
