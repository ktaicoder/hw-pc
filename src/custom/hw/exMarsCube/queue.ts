import { Packet } from './IExMarsCubeControl'

export class Queue {
  private items: Array<Packet> = [[]]
  public length = 0

  public constructor() {}

  public async enqueue(item: Packet): Promise<void> {
    this.items.push(item)
    this.length = this.items.length
  }

  public peek(): Packet {
    return this.items[0]
  }

  public async dequeue(): Promise<Array<number>> {
    const buffer: Packet | undefined = this.items.shift()
    this.length = this.items.length
    return buffer ? buffer : []
  }

  public clear(): void {
    this.items = []
    this.length = this.items.length
  }
}
