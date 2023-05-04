import KeyboardDoubleArrowLeftRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowLeftRounded'
import KeyboardDoubleArrowRightRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowRightRounded'
import { Box, Button, CircularProgress, IconButton, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useUnmount } from 'react-use'
import { firstValueFrom, interval } from 'rxjs'
import { CodingpackActionKindKey } from 'src/domain/codingpack'
import { CodingpackActions } from 'src/render/features/CodingpackHome/CodingpackActions'
import { HwClient } from '../socket/HwClient'

type RunningCallbackFn = (running: boolean) => void

type Props = {
  hwClient: HwClient
  onRunning: RunningCallbackFn
  minimized: boolean
  toggleMinimize: () => void
}

const ACTION_KIND: CodingpackActionKindKey = 'rescue'
const REBOOTING_TIME_SECONDS = 40

export default function RescueView(props: Props) {
  const { hwClient, minimized, toggleMinimize } = props
  const [cmdRunning, setCmdRunning] = useState(false)
  const [cmdCanceling, setCmdCanceling] = useState(false)
  const onRunningRef = useRef<RunningCallbackFn>()
  const [errorMessage, setErrorMessage] = useState<string>()
  const runContextRef = useRef({ canceled: false })
  const actionData = useMemo(() => CodingpackActions.find((it) => it.kind === ACTION_KIND)!, [])
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerText, setTimerText] = useState<string>()

  onRunningRef.current = props.onRunning
  useEffect(() => {
    onRunningRef.current?.(cmdRunning)
  }, [cmdRunning])

  const doStart = useCallback(async () => {
    setCmdRunning(true)
    setErrorMessage(undefined)
    setTimerSeconds(REBOOTING_TIME_SECONDS)
    try {
      await firstValueFrom(hwClient.runRescue())
    } catch (err) {
      setErrorMessage(err.message)
    } finally {
      setCmdRunning(false)
      setTimerSeconds(0)
    }
  }, [hwClient])

  useEffect(() => {
    if (timerSeconds <= 0) {
      setTimerText(undefined)
      return
    }
    let remainSecs = timerSeconds
    const s1 = interval(1000).subscribe((tick) => {
      remainSecs--
      setTimerText(`${remainSecs}초`)
    })
    return () => {
      s1.unsubscribe()
    }
  }, [timerSeconds])

  useUnmount(() => {
    runContextRef.current.canceled = true
  })

  if (cmdRunning) {
    return (
      <Box
        sx={{
          py: 1,
          px: 2,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          '& em': {
            fontStyle: 'normal',
            color: 'secondary',
          },
        }}
      >
        {!timerText && <CircularProgress color="warning" size="1rem" />}
        {timerText && (
          <Typography variant="subtitle1" sx={{ ml: 1, fontSize: '1.0rem', color: '#000', fontWeight: 700 }}>
            {timerText}
          </Typography>
        )}

        <Typography variant="subtitle1" sx={{ ml: 1, fontSize: '1.0rem', fontWeight: 700 }}>
          {actionData.title}
        </Typography>
      </Box>
    )
  } else {
    return (
      <Box
        sx={{
          px: 3,
          pt: 0,
          pb: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
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
        <Box sx={{ fontSize: '0.85rem', mt: 1, textAlign: 'center', color: 'primary.main' }}>{actionData.subtitle}</Box>

        <Box sx={{ fontSize: '0.85rem', mt: 2, textAlign: 'center' }}>
          재부팅하는 동안 연결은 끊어지고,
          <br /> 재부팅이 완료 후 자동으로 연결됩니다.
        </Box>
        <Box sx={{ fontSize: '0.85rem', mt: 2, textAlign: 'center' }}>
          보통 <em>5 ~ 10분</em> 소요되는데, <br />
          네트워크 속도에 따라 시간이 더 걸릴 수 있습니다.
        </Box>
        <Box sx={{ fontSize: '0.85rem', mt: 2, textAlign: 'center', color: 'primary.main' }}>
          복구는 업그래이드 기능을 포함합니다.
          <br />
          추가적인 업데이트는 필요하지 않습니다.
        </Box>

        <Button
          sx={{ mt: 4 }}
          variant="outlined"
          onClick={() => doStart()}
          color={cmdRunning ? 'secondary' : 'primary'}
        >
          실행하기
        </Button>

        {errorMessage && <Typography>{errorMessage}</Typography>}
      </Box>
    )
  }
}
