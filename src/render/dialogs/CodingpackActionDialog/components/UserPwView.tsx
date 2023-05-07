import KeyboardDoubleArrowLeftRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowLeftRounded'
import KeyboardDoubleArrowRightRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowRightRounded'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { useUnmount } from 'react-use'
import { firstValueFrom } from 'rxjs'
import { CodingpackActionKindKey } from 'src/domain/codingpack'
import { CodingpackActions } from 'src/render/features/CodingpackHome/CodingpackActions'
import { default as sleepAsync } from 'delay'
import { useTimeoutText } from 'src/render/hooks/useTimeoutText'
import { HwClient } from '../socket/HwClient'

type RunningCallbackFn = (running: boolean) => void

type Props = {
  hwClient: HwClient
  onRunning: RunningCallbackFn
  minimized: boolean
  toggleMinimize: () => void
}

const ACTION_KIND: CodingpackActionKindKey = 'pw'

export default function UserPwView(props: Props) {
  const { hwClient, minimized, toggleMinimize } = props
  const [cmdRunning, setCmdRunning] = useState(false)
  const [cmdCanceling, setCmdCanceling] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const onRunningRef = useRef<RunningCallbackFn>()
  const [errorMessage, setErrorMessage] = useState<string>()
  const runContextRef = useRef({ canceled: false })
  const actionData = useMemo(() => CodingpackActions.find((it) => it.kind === ACTION_KIND)!, [])
  const [password, setPassword] = useState<string>()
  const [resultMessage, setResultMessage] = useTimeoutText(2500)

  onRunningRef.current = props.onRunning
  useEffect(() => {
    onRunningRef.current?.(cmdRunning)
  }, [cmdRunning])

  const doStart = useCallback(
    async (pw: string) => {
      setCmdRunning(true)
      setErrorMessage(undefined)
      const startTime = Date.now()
      try {
        await firstValueFrom(hwClient.runPasswdChange(pw))
        const diff = Date.now() - startTime
        if (diff < 2500) {
          await sleepAsync(1500)
        }
        setResultMessage('변경되었습니다')
        toast.success('변경되었습니다')
        setPassword('')
      } catch (err) {
        const diff = Date.now() - startTime
        if (diff < 2500) {
          await sleepAsync(1500)
        }
        setErrorMessage(err.message)
        setResultMessage('변경실패')
        toast.warn('실패했습니다')
      } finally {
        setCmdRunning(false)
      }
    },
    [hwClient, setResultMessage],
  )

  const doCancel = useCallback(async () => {
    setCmdCanceling(true)
    setErrorMessage(undefined)
    try {
      await firstValueFrom(hwClient.cancelTerminalInput())
    } catch (err) {
    } finally {
      setCmdCanceling(false)
      setCmdRunning(false)
    }
  }, [hwClient])

  useUnmount(() => {
    runContextRef.current.canceled = true
  })

  const validateAndSave = () => {
    const pw = password?.trim() ?? ''
    if (!pw) {
      alert('비밀번호를 입력해주세요')
      return
    }

    if (pw.length < 4) {
      alert('비밀번호가 너무 짧습니다')
      return
    }

    if (pw.length > 30) {
      alert('비밀번호가 너무 깁니다')
      return
    }

    if (pw.includes("'") || pw.includes('"') || pw.includes('`')) {
      toast.warn('비밀번호에 따옴표를 포함할 수 없습니다')
      return
    }

    doStart(pw)
  }

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
        {!cmdCanceling && (
          <Tooltip title="실행 취소">
            <IconButton onClick={() => doCancel()} color="error">
              <HighlightOffIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {cmdCanceling && <CircularProgress color="warning" size="1rem" />}

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
        <Typography variant="body1" sx={{ mt: 2, textAlign: 'center', fontSize: '0.8rem' }}>
          비밀번호를 입력해주세요
        </Typography>

        <Box sx={{ fontSize: '0.85rem', mt: 1 }}>
          <OutlinedInput
            fullWidth
            autoFocus
            size="small"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={(e) => setShowPassword((p) => !p)}
                  onMouseDown={(e) => e.preventDefault()}
                  edge="end"
                >
                  {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                </IconButton>
              </InputAdornment>
            }
            onChange={(e) => setPassword(e.target.value)}
            value={password ?? ''}
          />
        </Box>

        {resultMessage && (
          <Box>
            <Typography sx={{ fontSize: '0.85rem', color: 'error.main' }}>{resultMessage}</Typography>
          </Box>
        )}

        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={() => validateAndSave()} color={cmdRunning ? 'secondary' : 'primary'}>
            비밀번호 변경
          </Button>
        </Box>

        {errorMessage && <Typography>{errorMessage}</Typography>}
      </Box>
    )
  }
}
