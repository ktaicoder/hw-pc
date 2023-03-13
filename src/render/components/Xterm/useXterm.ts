import { useCallback, useEffect, useRef, useState } from 'react'
import { ITerminalOptions, Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

export function useXterm(options?: ITerminalOptions) {
  const [terminal, setTerminal] = useState<Terminal>()
  const [fitAddon, setFitAddon] = useState<FitAddon>()
  const optionsRef = useRef<ITerminalOptions | undefined>(options)

  const loadTerminal = useCallback(async (options?: ITerminalOptions) => {
    const terminal = await import('xterm').then((m) => new m.Terminal(options))
    const fitAddon = await import('xterm-addon-fit').then((m) => new m.FitAddon())
    setFitAddon(fitAddon)
    setTerminal(terminal)
    terminal.attachCustomKeyEventHandler((key: KeyboardEvent) => {
      if (key.code === 'KeyC' || key.code === 'KeyV') {
        if (key.ctrlKey && key.shiftKey) {
          return false
        }
      }
      return true
    })
  }, [])

  useEffect(() => {
    loadTerminal(optionsRef.current)

    return () => {}
  }, [loadTerminal])

  return { fitAddon, terminal }
}
