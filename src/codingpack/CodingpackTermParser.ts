import { Transform, TransformCallback } from 'stream'

const LOG_TAG = 'CodingpackTermParser'

/**
 * CodingpackTermParser입니다
 */
export class CodingpackTermParser extends Transform {
  // 중개 버퍼
  private buffer: Buffer

  // 중개 버퍼에 채워진 바이트수
  private bufferByteCount = 0

  // 시작 마크
  private startMark = 0x02

  // 종료 마크
  private endMark = 0x03

  // 22바이트를 채워서 보냅니다
  private packetLength = 22

  constructor() {
    super()
    this.buffer = Buffer.alloc(this.packetLength, 0)
    this.bufferByteCount = 0
    console.log(LOG_TAG, 'constructor()')
  }

  _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback) {
    for (let i = 0; i < chunk.length; i++) {
      // console.log('this.bufferByteCount=', this.bufferByteCount, chunk[i])
      if (this.bufferByteCount === 0) {
        const byte = chunk[i]
        if (byte === this.startMark) {
          this.buffer[0] = byte
          this.bufferByteCount = 1
        }
        // skip
        continue
      }

      const byte = chunk[i]
      this.buffer[this.bufferByteCount++] = byte

      if (this.bufferByteCount === this.packetLength) {
        if (byte === this.endMark) {
          this.push(Buffer.from(this.buffer))
          this.bufferByteCount = 0
        } else {
          console.log(LOG_TAG, 'end-mark mismatch')
          const idx = this.buffer.indexOf(this.startMark, 1)
          if (idx > 0) {
            const tmpBuf = this.buffer.subarray(idx)
            tmpBuf.copy(this.buffer)
            this.bufferByteCount = tmpBuf.byteLength
          }
        }
      }
    }
    callback()
  }
}
