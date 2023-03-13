import { Subject } from 'rxjs'
import { IUiLogger, IUiLogMessage, UiLogMessageType } from 'src/custom-types'

const TRACE = true

export class UiLogger implements IUiLogger {
  constructor(private readonly message$: Subject<IUiLogMessage>) {}

  d = (logTag: string, msg: UiLogMessageType) => {
    this.message$.next({ level: 'd', msg, logTag })
    if (logTag !== 'RX' && logTag !== 'TX') console.log(logTag, msg)
  }

  i = (logTag: string, msg: UiLogMessageType) => {
    this.message$.next({ level: 'i', msg, logTag })
    console.log(logTag, msg)
  }

  w = (logTag: string, msg: UiLogMessageType) => {
    this.message$.next({ level: 'w', msg, logTag })
    console.log(logTag, msg)
  }

  e = (logTag: string, msg: UiLogMessageType) => {
    this.message$.next({ level: 'e', msg, logTag })
    console.log(logTag, msg)
  }
}

export class DummyUiLogger implements IUiLogger {
  d = (logTag: string, msg: UiLogMessageType) => {}

  i = (logTag: string, msg: UiLogMessageType) => {}

  w = (logTag: string, msg: UiLogMessageType) => {}

  e = (logTag: string, msg: UiLogMessageType) => {}
}
