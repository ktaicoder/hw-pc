import { Box, SxProps } from '@mui/material'
import clsx from 'clsx'
import { CSSProperties, useCallback, useEffect, useRef } from 'react'
import { interval, take } from 'rxjs'
import { ITerminalOptions, Terminal } from 'xterm'
import 'xterm/css/xterm.css'
import { useXterm } from './useXterm'

type Props = {
  className?: string
  sx?: SxProps
  style?: CSSProperties
  options?: ITerminalOptions
  onLoadTerminal?: (terminal: Terminal | undefined | null) => void
}

export default function Xterm(props: Props) {
  const { sx, style, className, options } = props
  const rootRef = useRef<HTMLDivElement | null>(null)
  const { terminal, fitAddon } = useXterm(options)
  const onLoadTerminalFn = useRef<Props['onLoadTerminal']>()
  onLoadTerminalFn.current = props.onLoadTerminal

  useEffect(() => {
    if (!rootRef.current || !terminal || !fitAddon) {
      onLoadTerminalFn.current?.(null)
      return
    }

    const rootElement = rootRef.current
    terminal.loadAddon(fitAddon)
    terminal.open(rootRef.current)
    fitAddon.fit()
    onLoadTerminalFn.current?.(terminal)

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit()
    })
    resizeObserver.observe(rootElement)

    const onWindowResize = () => {
      fitAddon.fit()
    }
    window.addEventListener('resize', onWindowResize)
    return () => {
      resizeObserver.unobserve(rootElement)
      window.removeEventListener('resize', onWindowResize)
      terminal.dispose()
    }
  }, [terminal, fitAddon])

  // 초기에 폰트가 로드 안된상태로 표시되는데, resize()호출하면 다시 그려진다
  const refreshTerm = useCallback((term: Terminal) => {
    const rows = term.rows
    term.resize(term.cols, rows + 1)
    term.resize(term.cols, rows)
  }, [])

  // 터미널 refresh, 1초 간격으로 3번
  useEffect(() => {
    if (!terminal) return
    if (!fitAddon) return
    const s1 = interval(1000)
      .pipe(take(3))
      .subscribe(() => {
        refreshTerm(terminal)
        fitAddon.fit()
      })
    return () => {
      s1.unsubscribe()
    }
  }, [terminal, fitAddon, refreshTerm])

  return <Box className={clsx('Xterm-root', className)} ref={rootRef} style={style} sx={sx} />
}
