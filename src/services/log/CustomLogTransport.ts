import WinstonTransport from 'winston-transport'

export class CustomLogTransport extends WinstonTransport {
  constructor(opt: WinstonTransport.TransportStreamOptions) {
    super(opt)
  }

  public log(
    info: {
      message: string
      level: string
      timestamp: string
    },
    callback: () => void,
  ) {
    // console.log(info)
    console.log(info.message)
    setImmediate(() => {
      this.emit('logged', info)
    })
    callback()
  }
}
