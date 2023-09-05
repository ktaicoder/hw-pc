import { Subject } from 'rxjs'
import { IUiLogger, IUiLogMessage, UiLogMessageType } from 'src/custom-types'

export class UiLogger implements IUiLogger {
  readonly message$ = new Subject<IUiLogMessage>()

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
  d = (logTag: string, msg: UiLogMessageType) => {
    // empty
  }

  i = (logTag: string, msg: UiLogMessageType) => {
    // empty
  }

  w = (logTag: string, msg: UiLogMessageType) => {
    // empty
  }

  e = (logTag: string, msg: UiLogMessageType) => {
    // empty
  }
}

export const dummyLogger = new DummyUiLogger()

export const uiLogger = new UiLogger()
