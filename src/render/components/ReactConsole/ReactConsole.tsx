import { Box, SxProps } from '@mui/material'
import clsx from 'clsx'
import * as React from 'react'
import { flatSx } from 'src/render/util/sx-props'
import { ASCII } from './ascii'

const MAX_LINES = 10000

// 20%씩 지우면서 최대치에 도달한다
const SLICE_TRIGGER_LINES = Math.round(MAX_LINES * 0.2)

// const Ascii = {
//     ETX: 3, // ctrl+c
//     EOT: 4, // ctrl+d
//     BS: 8,
//     LF: 10,
//     CR: 13,
//     DC1: 17,
//     DC2: 18,
//     DC3: 19,
//     DC4: 20,
//     CAN: 24,
//     ESC: 27,
//     FS: 28,
//     DEL: 127,
// }

const ControlChars = {
  ctrl_c: [ASCII.ETX],
  QUIT: [ASCII.FS],
  EOF: [ASCII.EOT],
  NL: [ASCII.LF],
  STOP: [ASCII.DC3],
  START: [ASCII.DC1],
}

export const ControlKeys = {
  c: ControlChars.ctrl_c,
  d: ControlChars.EOF,
  s: ControlChars.STOP,
  q: ControlChars.START,
  '\\': ControlChars.QUIT,
}

export interface ReactConsoleProps {
  // general props
  sx?: SxProps
  className?: string
  autoFocus?: boolean
  readonly?: boolean
  hide?: boolean
  prompt?: string
  welcomeMessage?: string | undefined
  // history props
  history?: string[]
  onSubmitBinary: (cmd: Uint8Array) => void
  onSubmitText: (cmd: string) => void
  consoleRef?: (console: ReactConsoleControl | null) => void
}

type ConsoleText = {
  text: string
}

type ReactConsoleState = {
  output: ConsoleText[]
  input: string
}

export interface ReactConsoleControl {
  print: (msg: string[] | string) => void
  getLineCount: () => number
  clear: () => void
  scrollToBottom: () => void
}
type Props = ReactConsoleProps

export class ReactConsole
  extends React.Component<Props, ReactConsoleState>
  implements ReactConsoleControl
{
  inputRef: any = null
  wrapperRef: any = null
  static defaultProps = {
    prompt: '$',
    autoFocus: false,
    readonly: false,
  }

  state = {
    input: '',
    output: [],
  }

  componentDidMount() {
    const { welcomeMessage } = this.props
    if (welcomeMessage) {
      this.setState({
        output: [{ text: welcomeMessage }],
      })
    }
    this.props.consoleRef?.(this)
  }

  public clear = () => {
    this.setState({ output: [], input: '' })
  }

  public scrollToBottom = () => {
    setTimeout(() => {
      const wrapper = this.wrapperRef
      if (wrapper && typeof wrapper.scrollHeight !== 'undefined') {
        wrapper.scrollTop = wrapper.scrollHeight
      }
    }, 0)
  }

  shouldComponentUpdate(nextProps: Props) {
    if (nextProps.hide !== this.props.hide) {
      this.scrollToBottom()
    }
    return true
  }

  private appendOutput = (newMessage: string, input?: string | null) => {
    input = input ?? this.state.input
    if (this.state.output.length > MAX_LINES) {
      this.setState({
        input,
        output: [...this.state.output.slice(SLICE_TRIGGER_LINES), { text: newMessage }],
      })
    } else {
      this.setState({
        input,
        output: [...this.state.output, { text: newMessage }],
      })
    }
  }

  public getLineCount = (): number => {
    return this.state.output.length
  }

  public print = (msgLines: string[] | string) => {
    // console.log('print:' + inputString)
    if (typeof msgLines === 'string') {
      this.appendOutput(msgLines)
    } else {
      if (msgLines.length === 0) {
        return
      }
      this.appendOutput(msgLines.join(''))
    }

    if (this.inputRef) {
      this.inputRef.focus()
      this.scrollToBottom()
    }
  }

  /**
   * Takes current text of a main input and generates a string that will be outputted as a log.
   */
  private getCurrentTextSnapshot = (): string => {
    const { prompt } = this.props
    const inputString: string = this.state.input
    return `${prompt} ${inputString}`
  }

  private onSubmit = (e: any) => {
    e.preventDefault()
    this._onSubmit()
  }

  private _onSubmit = async () => {
    const inputString = this.state.input
    if (!inputString) {
      return
    }

    const log = this.getCurrentTextSnapshot()
    if (inputString === '') {
      this.appendOutput(log, '')
      this.scrollToBottom()
      return
    }

    const [cmd, ...args] = inputString.split(' ')
    if (cmd === 'clear') {
      this.clear()
      return
    }

    this.props.onSubmitText(inputString)
    this.appendOutput(log, '')
    if (this.inputRef) {
      this.inputRef.focus()
      this.scrollToBottom()
    }
  }

  /**
   * Main input change handler.
   * @param event
   */
  private onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      input: event.target.value,
    })
  }

  /**
   * onKeyDown implementation of a main input.
   * @param event
   */
  private onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      const input = this.state.input ?? ''
      if (input.length === 0) {
        this.props.onSubmitText('')
        this.scrollToBottom()
      } else {
        this._onSubmit()
      }
    } else if (event.ctrlKey) {
      const values = ControlKeys[event.key]
      if (values) {
        event.preventDefault()
        this.appendOutput(`${this.props.prompt} ^${event.key}`, '')
        this.props.onSubmitBinary(new Uint8Array(values))
        this.scrollToBottom()
      }
    }
  }

  /**
   * Focuses console input.
   * Whenever an user clicks on a terminal, we want to focus an actual input where he/she can type.
   */
  public focusConsole = () => {
    if (this.inputRef) {
      if (document.getSelection()!.isCollapsed) {
        this.inputRef.focus()
      }
    }
  }

  render() {
    const { sx, className, hide = false, prompt, autoFocus, readonly } = this.props
    if (hide) return <div />

    return (
      <Box
        className={clsx('ReactConsole-root', className)}
        sx={flatSx(
          {
            display: 'flex',
            flexDirection: 'column',
            color: 'white',
            flex: 1,
            fontFamily: '"Nanum Gothic Coding",monospace',
            fontSize: '0.85rem',
            padding: 2,
            overflowY: 'auto',
          },
          sx,
        )}
        onClick={this.focusConsole}
        ref={(ref) => (this.wrapperRef = ref)}
      >
        <div>
          {this.state.output
            .map(({ text, level }) => ({ level, text }))
            .map(({ text, level = 'debug' }, key) => (
              <Box
                component="pre"
                key={key}
                sx={{
                  lineHeight: 1.2,
                  fontFamily: '"Nanum Gothic Coding",monospace',
                  fontSize: '0.85rem',
                  padding: 0,
                  color: 'white',
                }}
                dangerouslySetInnerHTML={{ __html: text }}
              />
            ))}
        </div>
        <form onSubmit={this.onSubmit} style={{ display: readonly ? 'none' : 'inherit' }}>
          <Box sx={{ display: 'flex' }}>
            <Box
              component="span"
              sx={{ display: 'flex', alignItems: 'center', color: readonly ? '#bbb' : 'green' }}
            >
              {prompt}&nbsp;
            </Box>
            <Box
              component="input"
              sx={{
                flex: 1,
                background: 'transparent!important',
                border: 'none',
                outline: 'none',
                // background: 'rgba(255,0,0,0.3)',
                color: 'white',
                fontFamily: '"Nanum Gothic Coding",monospace',
                fontSize: '0.85rem',
              }}
              disabled={readonly}
              ref={(ref) => (this.inputRef = ref)}
              autoFocus={autoFocus}
              value={this.state.input}
              onChange={this.onInputChange}
              onKeyDown={this.onKeyDown}
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="false"
              name="input"
            />
          </Box>
        </form>
      </Box>
    )
  }
}
