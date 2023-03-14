import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked'
import { Box, ButtonBase, SxProps, Typography } from '@mui/material'
import chalk from 'chalk'
import { useEffect, useRef } from 'react'
import { useUpdate } from 'react-use'
import { IUiLogMessage, UiLogLevel } from 'src/custom-types'
import Xterm from 'src/render/components/Xterm'
import { useUiLog } from 'src/services/hw/useUiLog'
import { ITerminalOptions, Terminal } from 'xterm'
import { DEFAULT_TERM_OPTIONS, toTermHexLine } from './xterm-util'

const TERM_MAX_LINES = 10000

const TERM_OPTIONS: ITerminalOptions = {
  cursorStyle: 'underline',
  ...DEFAULT_TERM_OPTIONS,
  theme: {
    background: '#00000000',
  },
}

const TermColors: Record<UiLogLevel, (s: string) => string> = {
  d: (s: string) => s,
  i: chalk.cyanBright,
  w: chalk.yellowBright,
  e: chalk.redBright,
}

type Props = {
  disabled?: boolean
  sx?: SxProps
}

export default function ConsoleView(props: Props) {
  const { sx } = props
  const uiLogManager = useUiLog()
  const termRef = useRef<Terminal | null>(null)
  const rxVisibleRef = useRef(true)
  const refresh = useUpdate()

  const disabledRef = useRef(false)
  disabledRef.current = props.disabled ?? false

  // 터미널 폰트가 로드된 후
  useEffect(() => {
    let lineCount = 0
    const s1 = uiLogManager.observeMessage().subscribe((msg) => {
      if (disabledRef.current) return

      // RX 무시
      if (msg.logTag === 'RX' && !rxVisibleRef.current) {
        return
      }
      appendTermLine(termRef.current, msg)
      lineCount++
      if (lineCount > TERM_MAX_LINES) {
        termRef.current?.clear()
        lineCount = 0
      }
    })
    termRef.current?.scrollLines
    return () => {
      s1.unsubscribe()
    }
  }, [uiLogManager])

  // 콘솔 지우기 버튼 클릭
  const handleClickConsoleClearBtn = () => {
    const term = termRef.current
    if (term) {
      term.clear()
    }
  }

  // 콘솔 지우기 버튼 클릭
  const handleClickRxVisibleBtn = () => {
    rxVisibleRef.current = !rxVisibleRef.current
    refresh()
  }

  return (
    <Box
      className="ConsoleView-root"
      sx={[
        {
          position: 'relative',
          pt: '40px',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          // border: '1px solid red',
        },
        ...(Array.isArray(sx) ? sx : [sx ?? false]),
      ]}
    >
      <Box
        sx={{
          position: 'relative',
          flex: 1,
          width: '100%',
          // border: '1px solid green',
        }}
      >
        <Xterm
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
          options={TERM_OPTIONS}
          onLoadTerminal={(t) => {
            termRef.current = t ?? null
          }}
        />
      </Box>
      <Box
        sx={{
          position: 'absolute',
          top: 2,
          left: 0,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ButtonBase
          onClick={handleClickConsoleClearBtn}
          component="div"
          sx={{
            background: 'transparent',
            border: '1px solid #fff8',
            color: '#eee',
            fontSize: '0.80rem',
            borderRadius: 1,
            py: '2px',
            px: 1,
          }}
        >
          지우기
        </ButtonBase>
        <ButtonBase
          onClick={handleClickRxVisibleBtn}
          component="div"
          sx={{
            ml: 2,
            background: 'transparent',
            border: rxVisibleRef.current ? 'none' : '1px solid #fff8',
            borderRadius: 1,
            color: rxVisibleRef.current ? 'error.main' : '#ccc',
            fontSize: '0.80rem',
            py: '2px',
            px: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {rxVisibleRef.current && <RadioButtonCheckedIcon sx={{ mr: 1 }} />}
          <Typography>RX 표시</Typography>
        </ButtonBase>
      </Box>
    </Box>
  )
}

function applyColor(level: UiLogLevel, text: string) {
  const colorFn = TermColors[level]
  return colorFn(text)
}

function applyTermColor(level: UiLogLevel, logTag: string, msg: string) {
  // prefix가 있을때는 level=d 일때도 컬러풀하게 출력하기
  if (level === 'd') {
    return logTag + ' ' + chalk.greenBright(msg)
  }

  const colorFn = TermColors[level]
  return logTag + ' ' + colorFn(msg)
}

function appendTermLine(term: Terminal | null, log: IUiLogMessage) {
  if (!term) return

  const { level, logTag, msg } = log
  if (typeof msg === 'string') {
    term.writeln(applyTermColor(level, logTag, msg))
    return
  }

  if (Array.isArray(msg)) {
    term.writeln(applyTermColor(level, logTag, JSON.stringify(msg)))
    return
  }

  // msg is Uint8Array
  if (logTag.length > 0) {
    term.write(chalk.blue(logTag))
    term.write(' ')
  }

  term.writeln(
    // toTermHexLine(dataBuffer, bytesPerTermLine, chalk.white, chalk.greenBright),
    toTermHexLine(msg, 16, chalk.white, chalk.greenBright),
  )
}
