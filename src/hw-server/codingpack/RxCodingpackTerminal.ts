import { bufferTime, EMPTY, filter, from, map, mergeMap, Observable, of } from 'rxjs'
import { ISerialDevice } from 'src/custom-types'

export class RxCodingpackTerminal {
  static serialToSocket = (device: ISerialDevice): Observable<Buffer> => {
    console.log('RxCodingpackTerminal.serialToSocket() started')
    let prevPending: Buffer | null = null
    return device.observeReceivedData().pipe(
      map((it) => it.dataBuffer),
      bufferTime(300),
      mergeMap((lines): Observable<Buffer> => {
        const [acceptedLines, newPending] = splitLines(lines)
        if (acceptedLines.length > 0) {
          if (prevPending && prevPending.length > 0) {
            acceptedLines[0] = Buffer.concat([prevPending, acceptedLines[0]])
          }
          prevPending = newPending
          return from(acceptedLines as Buffer[])
        } else {
          // 새로운 pending이 있다면 저장, 다음턴에 보낸다
          if (newPending && newPending.length > 0) {
            if (prevPending && prevPending.length > 0) {
              prevPending = Buffer.concat([prevPending, newPending])
            } else {
              prevPending = newPending
            }
            return EMPTY
          } else {
            // 새로운 pending이 없으므로 이전 pending을 보낸다
            if (prevPending && prevPending.length > 0) {
              const v = prevPending
              prevPending = null
              return of(v)
            } else {
              return EMPTY
            }
          }
        }
      }),
      filter((line) => line.length > 0),
    )
  }
}

// 구현못하겠다
function removeControlCharacter(data: Buffer) {
  return data
}

function splitLines(msgLines: Buffer[]): [Buffer[], Buffer | null] {
  if (msgLines.length === 0) return [[], null]

  const LF = 10
  const bufferList: Buffer[] = []
  let tempArray: number[] = []
  for (const msg of msgLines) {
    for (let i = 0; i < msg.length; i++) {
      tempArray.push(msg[i])
      if (msg[0] === LF) {
        bufferList.push(Buffer.from(tempArray))
        tempArray = []
      }
    }
  }

  if (tempArray.length === 0) {
    return [bufferList, null]
  } else {
    return [bufferList, Buffer.from(tempArray)]
  }
}
