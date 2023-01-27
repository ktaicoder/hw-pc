import KeyboardDoubleArrowLeftRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowLeftRounded'
import KeyboardDoubleArrowRightRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowRightRounded'
import { Box, Button, CircularProgress, IconButton, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useUnmount } from 'react-use'
import { firstValueFrom } from 'rxjs'
import { CodingpackActionKindKey } from 'src/domain/codingpack'
import { CodingpackActions } from 'src/render/features/codingpack/codingpack-actions'
import { HwClient } from '../socket/HwClient'

type RunningCallbackFn = (running: boolean) => void

type Props = {
  hwClient: HwClient
  onRunning: RunningCallbackFn
  minimized: boolean
  toggleMinimize: () => void
}

const ACTION_KIND: CodingpackActionKindKey = 'sdexpand'

export default function SdcardExpandView(props: Props) {
  const { hwClient, minimized, toggleMinimize } = props
  const [cmdRunning, setCmdRunning] = useState(false)
  const [cmdCanceling, setCmdCanceling] = useState(false)
  const onRunningRef = useRef<RunningCallbackFn>()
  const [errorMessage, setErrorMessage] = useState<string>()
  const runContextRef = useRef({ canceled: false })
  const actionData = useMemo(() => CodingpackActions.find((it) => it.kind === ACTION_KIND)!, [])
  onRunningRef.current = props.onRunning
  useEffect(() => {
    onRunningRef.current?.(cmdRunning)
  }, [cmdRunning])

  const doStart = useCallback(async () => {
    setCmdRunning(true)
    setErrorMessage(undefined)
    try {
      await firstValueFrom(hwClient.runSdcardExpand())
    } catch (err) {
      setErrorMessage(err.message)
    } finally {
      setCmdRunning(false)
    }
  }, [hwClient])

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
        <CircularProgress color="warning" size="1rem" />

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
          2022년 8월 4일 이후에 배포된 OS 이미지에서만 동작합니다.
          <br />
        </Box>
        <Box sx={{ fontSize: '0.85rem', mt: 2, textAlign: 'center' }}>
          보통 SD카드 확장은 <em>5초</em> 정도 소요됩니다. <br />
          두 번 실행해도 문제가 되지는 않지만, <br />
          이미 실행한 적이 있다면 실행하지 않아도 됩니다.
        </Box>
        <Box sx={{ fontSize: '0.85rem', mt: 2, textAlign: 'center', color: 'primary.main' }}>
          SD카드가 확장 된 후에는 자동으로 재부팅합니다.
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
