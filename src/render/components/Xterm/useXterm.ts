import { useCallback, useEffect, useRef, useState } from 'react'
import { useCopyToClipboard } from 'react-use'
import { ITerminalOptions, Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

export function useXterm(options?: ITerminalOptions) {
  const [terminal, setTerminal] = useState<Terminal>()
  const [fitAddon, setFitAddon] = useState<FitAddon>()
  const optionsRef = useRef<ITerminalOptions | undefined>(options)
  const [_, copyToClipboard] = useCopyToClipboard()
  const loadTerminal = useCallback(
    async (options?: ITerminalOptions) => {
      const terminal = await import('xterm').then((m) => new m.Terminal(options))
      const fitAddon = await import('xterm-addon-fit').then((m) => new m.FitAddon())
      setFitAddon(fitAddon)
      setTerminal(terminal)
    },
    [copyToClipboard],
  )

  useEffect(() => {
    loadTerminal(optionsRef.current)
    return () => {}
  }, [loadTerminal])

  useEffect(() => {
    if (!terminal) return
    terminal.attachCustomKeyEventHandler((key: KeyboardEvent) => {
      if (key.ctrlKey && key.code === 'KeyC') {
        if (key.shiftKey) {
          return true
        }
      }

      if (key.code === 'KeyC') {
        const str = terminal.getSelection()
        if (str.length > 0) {
          copyToClipboard(str)
          terminal.clearSelection()
          return false
        }
      }

      return true
    })

    const disaposable = terminal.onSelectionChange(() => {
      const sel = terminal.getSelection() ?? ''
      if (sel.length > 0) {
        copyToClipboard(sel)
      }
    })

    return () => {
      disaposable.dispose()
    }
  }, [terminal])

  return { fitAddon, terminal }
}
