const textDecoder = new TextDecoder('utf-8')

export class HcpPacket {
  private channelId_: string

  private proc_: string

  constructor(
    channelId: string,
    proc: string,
    public readonly body: Uint8Array | null | undefined,
    public readonly headers: Record<string, string>,
  ) {
    this.channelId_ = channelId
    this.proc_ = proc
  }

  channelId = (): string => {
    return this.channelId_
  }

  proc = (): string => {
    return this.proc_
  }

  contentType = (): string => {
    return this.headers['contentType'] ?? ''
  }

  requestId = (): string | undefined | null => {
    return this.headers['requestId']
  }

  hwId = (): string | null => {
    return this.headerOf('hwId')
  }

  bodyLength = (): number => {
    if (typeof this.body === 'undefined' || this.body === null) return 0
    return this.body.byteLength
  }

  headerOf = (headerKey: string): string | null => {
    const v = this.headers[headerKey]
    return typeof v === undefined ? null : v
  }

  bodyAsJson = (): any | null => {
    if (!this.body || this.bodyLength() === 0) return null
    return JSON.parse(textDecoder.decode(this.body))
  }

  bodyAsText = (): string | null => {
    if (!this.body || this.bodyLength() === 0) return null
    return textDecoder.decode(this.body)
  }

  toString(): string {
    return (
      'HcpMessage:' +
      JSON.stringify({
        headers: this.headers,
        body: `${this.bodyLength()} bytes`,
      })
    )
  }
}
