import { AbstractHwConrtol } from '../AbstractHwControl'
import {
  Action,
  CellColor,
  Color,
  DirectionFromFace,
  FaceColor,
  IExMarsCubeControl,
  Index,
  Mode,
  Packet,
  PacketType,
  Pitch,
  Record,
  Rotation,
  Switch,
} from './IExMarsCubeControl'
import { Queue } from './queue'

/**
 * 하드웨어 제어
 */
export class ExMarsCubeControl extends AbstractHwConrtol implements IExMarsCubeControl {
  private sQueue = new Queue()
  private rQueue = new Queue()
  private faceCell: Array<Packet> = new Array(6)
  private faceRotDir: Packet = new Array(6)
  private record: Array<Packet> = new Array(8)
  private currentMode: Packet = new Array(2)
  private receivedTimer: NodeJS.Timer
  private sendTimer: NodeJS.Timer
  private lastReadPacket: Buffer
  private readonly defaultDelayTime = 20
  private readonly sendPacketType: number = PacketType.sendByte

  async delay(ms?: number) {
    await new Promise((resolve) => {
      setTimeout(resolve, ms ? ms : this.defaultDelayTime)
    })
  }

  async getCellColor(ctx: any, face: string, cell: string): Promise<string> {
    await this.delay()
    const value: number = this.faceCell[parseInt(face)][parseInt(cell)]
    return this.convertEnumType(CellColor, Color, value).toString()
  }

  async getFaceColor(ctx: any, face: string): Promise<string[]> {
    await this.delay()
    const colors: Array<string> = new Array<string>(9)
    for (let cell = 0; cell < 9; cell++) {
      const value: number = this.faceCell[parseInt(face)][cell]
      colors[cell] = this.convertEnumType(CellColor, Color, value).toString()
    }
    return colors
  }

  async getFaceRotationValue(ctx: any, face: string): Promise<string> {
    await this.delay()
    const dir: number = this.faceRotDir[parseInt(face)]
    this.faceRotDir[parseInt(face)] = 0
    switch (dir) {
      case 3:
        return 'CW'
      case 11:
        return 'CCW'
      default:
        return '0'
    }
  }

  async getModeRecord(ctx: any, mode: string, record: string): Promise<number> {
    await this.delay()
    const aab = Math.floor(this.record[parseInt(mode)][parseInt(record)]) / 1000 // value / 10 / 100(%)
    return aab
  }

  async getDiceNumberRecord(ctx: any, record: string): Promise<number> {
    await this.delay()
    return Math.floor(this.record[Record.zeroTwoMode][parseInt(record)]) / 1000 // value / 10 / 100(%)
  }

  async getModeStatus(ctx: any): Promise<string> {
    await this.delay()
    const status = `${this.currentMode[Mode.main]}${this.currentMode[Mode.sub]}`
    return status
  }

  async setMenuInit(ctx: any): Promise<void> {
    const buffer: Packet = this.makePacketMenuSetting(10, 10)
    this.sQueue.enqueue(buffer)
    await this.delay()
  }

  async setModeSetting(ctx: any, main: string, sub: string): Promise<void> {
    const buffer: Packet = this.makePacketMenuSetting(parseInt(main), parseInt(sub))
    this.sQueue.enqueue(buffer)
    await this.delay()
  }

  async setPlayMode(ctx: any, scale: string): Promise<void> {
    const buffer: Packet = this.makePacketModeSetting(3, parseInt(scale))
    this.sQueue.enqueue(buffer)
    await this.delay()
  }

  async setUserMode(ctx: any, user: string): Promise<void> {
    const buffer: Packet = this.makePacketModeSetting(1, parseInt(user))
    this.sQueue.enqueue(buffer)
    await this.delay()
  }

  async setNonBrake(ctx: any, flag: string): Promise<void> {
    let buffer: Packet = new Array<number>(this.sendPacketType)
    switch (parseInt(flag)) {
      case Switch.Off:
        buffer = this.makePacketMenuSetting(13, 4)
        break
      case Switch.On:
        buffer = this.makePacketMenuSetting(9, 3)
        break
    }
    this.sQueue.enqueue(buffer)
    await this.delay()
  }

  async setResetAllFace(ctx: any): Promise<void> {
    const buffer: Packet = this.makePacketResetAllFace()
    this.sQueue.enqueue(buffer)
    await this.delay()
  }

  async setResetRotation(ctx: any): Promise<void> {
    for (let i = 0; i < this.faceRotDir.length; i++) {
      this.faceRotDir[i] = 0
    }
    await this.delay()
  }

  async setCenterColorChange(ctx: any, face: string, color: string): Promise<void> {
    const buffer: Packet = this.makePacketSetCenterColor(parseInt(face), parseInt(color))
    this.sQueue.enqueue(buffer)
    await this.delay()
  }

  async setCellColorChange(
    ctx: any,
    face: string,
    colorCell1: string,
    colorCell2: string,
    colorCell3: string,
    colorCell4: string,
    colorCell5: string,
    colorCell6: string,
    colorCell7: string,
    colorCell8: string,
  ): Promise<void> {
    const buffer: Packet = this.makePacketSetCellColor(
      parseInt(face),
      parseInt(colorCell1),
      parseInt(colorCell2),
      parseInt(colorCell3),
      parseInt(colorCell4),
      parseInt(colorCell5),
      parseInt(colorCell6),
      parseInt(colorCell7),
      parseInt(colorCell8),
    )
    this.sQueue.enqueue(buffer)
    await this.delay()
  }

  async setPositionDirectionTorqueChange(
    ctx: any,
    face: string,
    position: string,
    rotationDirection: string,
    torque: string,
  ): Promise<void> {
    const buffer: Packet = this.makePacketSetPosDirTor(
      parseInt(face),
      parseInt(position),
      parseInt(rotationDirection),
      parseInt(torque),
    )
    this.sQueue.enqueue(buffer)
    await this.delay()
  }

  async setFaceRotationOnlyColor(ctx: any, face: string, rotationDirection: string, angle: string): Promise<void> {
    const buffer: Packet = this.makePacketMoveFace(
      parseInt(face),
      this.calculrateAngle(parseInt(rotationDirection), parseInt(angle)),
    )
    this.sQueue.enqueue(buffer)
    await this.delay()
  }

  async setFaceRotation(ctx: any, face: string, rotationDirection: string, angle: string): Promise<void> {
    const buffer: Packet = this.makePacketFaceMoveWithMotor(
      parseInt(face),
      this.calculrateAngle(parseInt(rotationDirection), parseInt(angle)),
    )
    this.sQueue.enqueue(buffer)
    await this.delay()
  }

  async setFacesRotation(
    ctx: any,
    face1: string,
    rotationDirection1: string,
    angle1: string,
    face2: string,
    rotationDirection2: string,
    angle2: string,
  ): Promise<void> {
    const buffer: Packet = this.makePacketFacesMoveWithMotor(
      parseInt(face1),
      this.calculrateAngle(parseInt(rotationDirection1), parseInt(angle1)),
      parseInt(face2),
      this.calculrateAngle(parseInt(rotationDirection2), parseInt(angle2)),
    )
    this.sQueue.enqueue(buffer)
    await this.delay()
  }

  async setSolveCube(ctx: any, faceColor: string, faceLocation: string, seconds: string): Promise<void> {
    const fc: number = parseInt(faceColor)
    const fl: number = parseInt(faceLocation)
    let face: number = FaceColor.yellow
    let angle: number = Rotation.ninety
    if (fl % 2 == 1) {
      angle += 8
    }
    if (fc == FaceColor.green) {
      switch (fl) {
        case DirectionFromFace.forwardCW:
        case DirectionFromFace.forwardCCW:
          face = FaceColor.green
          break
        case DirectionFromFace.rightCW:
        case DirectionFromFace.rightCCW:
          face = FaceColor.purple
          break
        case DirectionFromFace.leftCW:
        case DirectionFromFace.leftCCW:
          face = FaceColor.red
          break
        case DirectionFromFace.upCW:
        case DirectionFromFace.upCCW:
          face = FaceColor.yellow
          break
        case DirectionFromFace.downCW:
        case DirectionFromFace.donwCCW:
          face = FaceColor.white
          break
        case DirectionFromFace.backwardCW:
        case DirectionFromFace.backwardCCW:
          face = FaceColor.blue
          break
      }
    } else if (fc == FaceColor.purple) {
      switch (fl) {
        case DirectionFromFace.forwardCW:
        case DirectionFromFace.forwardCCW:
          face = FaceColor.purple
          break
        case DirectionFromFace.rightCW:
        case DirectionFromFace.rightCCW:
          face = FaceColor.blue
          break
        case DirectionFromFace.leftCW:
        case DirectionFromFace.leftCCW:
          face = FaceColor.green
          break
        case DirectionFromFace.upCW:
        case DirectionFromFace.upCCW:
          face = FaceColor.yellow
          break
        case DirectionFromFace.downCW:
        case DirectionFromFace.donwCCW:
          face = FaceColor.white
          break
        case DirectionFromFace.backwardCW:
        case DirectionFromFace.backwardCCW:
          face = FaceColor.red
          break
      }
    } else if (fc == FaceColor.blue) {
      switch (fl) {
        case DirectionFromFace.forwardCW:
        case DirectionFromFace.forwardCCW:
          face = FaceColor.blue
          break
        case DirectionFromFace.rightCW:
        case DirectionFromFace.rightCCW:
          face = FaceColor.red
          break
        case DirectionFromFace.leftCW:
        case DirectionFromFace.leftCCW:
          face = FaceColor.purple
          break
        case DirectionFromFace.upCW:
        case DirectionFromFace.upCCW:
          face = FaceColor.yellow
          break
        case DirectionFromFace.downCW:
        case DirectionFromFace.donwCCW:
          face = FaceColor.white
          break
        case DirectionFromFace.backwardCW:
        case DirectionFromFace.backwardCCW:
          face = FaceColor.green
          break
      }
    } else if (fc == FaceColor.red) {
      switch (fl) {
        case DirectionFromFace.forwardCW:
        case DirectionFromFace.forwardCCW:
          face = FaceColor.red
          break
        case DirectionFromFace.rightCW:
        case DirectionFromFace.rightCCW:
          face = FaceColor.green
          break
        case DirectionFromFace.leftCW:
        case DirectionFromFace.leftCCW:
          face = FaceColor.blue
          break
        case DirectionFromFace.upCW:
        case DirectionFromFace.upCCW:
          face = FaceColor.yellow
          break
        case DirectionFromFace.downCW:
        case DirectionFromFace.donwCCW:
          face = FaceColor.white
          break
        case DirectionFromFace.backwardCW:
        case DirectionFromFace.backwardCCW:
          face = FaceColor.purple
          break
      }
    }
    const buffer: Packet = this.makePacketFaceMoveWithMotor(face, angle)
    this.sQueue.enqueue(buffer)
    await this.delay(parseFloat(seconds) * 1000)
  }

  async setPlayNote(ctx: any, pitchName: string, seconds: string): Promise<void> {
    let face: number = FaceColor.white
    let angle = 3

    if (parseInt(pitchName) !== 12) {
      if (parseInt(pitchName) % 2 == 1) {
        angle += 8
      }
      switch (parseInt(pitchName)) {
        case Pitch.C:
        case Pitch.CSharp:
          face = FaceColor.white
          break
        case Pitch.D:
        case Pitch.DSharp:
          face = FaceColor.yellow
          break
        case Pitch.E:
        case Pitch.F:
          face = FaceColor.green
          break
        case Pitch.FSharp:
        case Pitch.G:
          face = FaceColor.blue
          break
        case Pitch.GSharp:
        case Pitch.A:
          face = FaceColor.red
          break
        case Pitch.ASharp:
        case Pitch.B:
          face = FaceColor.purple
          break
      }

      const buffer: Packet = this.makePacketFaceMoveWithMotor(face, angle)
      await this.sQueue.enqueue(buffer)
      await this.delay(parseFloat(seconds) * 1000)
    }
  }
  async setReturnModeRecord(ctx: any, mode: string): Promise<void> {
    const buffer: Packet = this.makePacketRecord(parseInt(mode))
    this.sQueue.enqueue(buffer)
    await this.delay()
  }

  async setDiceStart(ctx: any, dice: string): Promise<void> {
    const buffer: Packet = this.makePacketDiceStart(parseInt(dice))
    this.sQueue.enqueue(buffer)
    await this.delay()
  }

  async setReturnDiceNumberRecord(ctx: any): Promise<void> {
    const buffer: Packet = this.makePacketRecord(Record.zeroTwoMode)
    this.sQueue.enqueue(buffer)
    await this.delay()
  }

  async setAutoSolveCube(ctx: any): Promise<void> {
    const buffer: Packet = this.makePacketRecord(7)
    this.sQueue.enqueue(buffer)
    await this.delay()
  }

  /**
   * 패킷 생성
   */
  private makePacket(index: number, param1: number, param2: number, param3: number, param4: number): Packet {
    const buffer: Packet = new Array<number>(this.sendPacketType)

    buffer[0] = 0
    buffer[1] = index
    buffer[2] = param1
    buffer[3] = param2
    buffer[4] = param3
    buffer[5] = param4
    buffer[6] = 90
    if (this.sendPacketType === PacketType.sendUSB) {
      buffer[7] = PacketType.received
      buffer[8] = 253
      buffer[9] = 254
      buffer[10] = 254
    }

    return buffer
  }

  private makePacketMenuSetting(main: number, sub: number): Packet {
    return this.makePacket(Index.menu, 11, main, sub, 255)
  }

  private makePacketModeSetting(index: number, mode: number): Packet {
    return this.makePacket(Index.menu, 30, index, mode, 255)
  }

  private makePacketSetCenterColor(face: number, color: number): Packet {
    const index: number = (face << 5) | Index.centerColor

    return this.makePacket(index, color, 0, 0, 0)
  }

  private makePacketSetCellColor(
    face: number,
    color1: number,
    color2: number,
    color3: number,
    color4: number,
    color5: number,
    color6: number,
    color7: number,
    color8: number,
  ): Packet {
    const index: number = (face << 5) | Index.cellColor
    const para1: number = (color1 << 4) | color2
    const para2: number = (color3 << 4) | color4
    const para3: number = (color5 << 4) | color6
    const para4: number = (color7 << 4) | color8

    return this.makePacket(index, para1, para2, para3, para4)
  }

  private makePacketSetPosDirTor(face: number, position: number, direction: number, torque: number): Packet {
    const index: number = (face << 5) | Index.posDirTor
    let pos = 0

    if (position < 2) {
      pos = 2
    } else if (position > 141) {
      pos = 141
    } else {
      pos = position
    }

    return this.makePacket(index, pos, direction, torque, 0)
  }

  private makePacketMoveFace(face: number, rotation: number): Packet {
    let para = 0
    let buffer: Packet = new Array<number>(this.sendPacketType)

    if (0 <= rotation && rotation <= 15) {
      if (face === FaceColor.white || face === FaceColor.green || face === FaceColor.red) {
        para = (rotation << 4) & 240
      } else if (face === FaceColor.yellow || face === FaceColor.blue || face === FaceColor.purple) {
        para = rotation & 15
      }
    }

    if (face === FaceColor.white || face === FaceColor.yellow) {
      buffer = this.makePacket(Index.face, Action.faceMove, para, 0, 0)
    } else if (face === FaceColor.green || face === FaceColor.blue) {
      buffer = this.makePacket(Index.face, Action.faceMove, 0, para, 0)
    } else if (face === FaceColor.red || face === FaceColor.purple) {
      buffer = this.makePacket(Index.face, Action.faceMove, 0, 0, para)
    }

    return buffer
  }

  private makePacketResetAllFace(): Packet {
    return this.makePacket(Index.face, Action.faceResetAll, 0, 0, 0)
  }

  private makePacketFaceMoveWithMotor(face: number, rotation: number): Packet {
    let para = 0
    let buffer: Packet = new Array<number>(this.sendPacketType)

    if (0 <= rotation && rotation <= 15) {
      if (face === FaceColor.white || face === FaceColor.green || face === FaceColor.red) {
        para = (rotation << 4) & 240
      } else if (face === FaceColor.yellow || face === FaceColor.blue || face === FaceColor.purple) {
        para = rotation & 15
      }
    }

    if (face === FaceColor.white || face === FaceColor.yellow) {
      buffer = this.makePacket(Index.face, Action.faceMoveWithMotor, para, 0, 0)
    } else if (face === FaceColor.green || face === FaceColor.blue) {
      buffer = this.makePacket(Index.face, Action.faceMoveWithMotor, 0, para, 0)
    } else if (face === FaceColor.red || face === FaceColor.purple) {
      buffer = this.makePacket(Index.face, Action.faceMoveWithMotor, 0, 0, para)
    }

    return buffer
  }

  private makePacketFacesMoveWithMotor(face1: number, rotation1: number, face2: number, rotation2: number): Packet {
    let para2 = 0
    let para3 = 0
    let para4 = 0

    switch (face1) {
      case FaceColor.white:
        para2 |= (rotation1 << 4) & 240
        break
      case FaceColor.yellow:
        para2 |= rotation1 & 15
        break
      case FaceColor.green:
        para3 |= (rotation1 << 4) & 240
        break
      case FaceColor.blue:
        para3 |= rotation1 & 15
        break
      case FaceColor.red:
        para4 |= (rotation1 << 4) & 240
        break
      case FaceColor.purple:
        para4 |= rotation1 & 15
        break
    }
    switch (face2) {
      case FaceColor.white:
        para2 |= (rotation2 << 4) & 240
        break
      case FaceColor.yellow:
        para2 |= rotation2 & 15
        break
      case FaceColor.green:
        para3 |= (rotation2 << 4) & 240
        break
      case FaceColor.blue:
        para3 |= rotation2 & 15
        break
      case FaceColor.red:
        para4 |= (rotation2 << 4) & 240
        break
      case FaceColor.purple:
        para4 |= rotation2 & 15
        break
    }

    return this.makePacket(Index.face, Action.faceMoveWithMotor, para2, para3, para4)
  }

  private makePacketDiceStart(dice: number): Packet {
    const index: number = Index.menu
    return this.makePacket(index, 21, dice, 255, 255)
  }

  private makePacketRecord(recordIndex: number): Packet {
    const index: number = (7 << 5) | Index.recordRequest
    return this.makePacket(index, recordIndex, 255, 255, 255)
  }

  private makePacketSensingRequest(): Packet {
    const index: number = (FaceColor.all << 5) | Index.sensingRequest
    return this.makePacket(index, 255, 255, 255, 255)
  }

  private async decodingPacket(packet: Packet | Buffer): Promise<void> {
    const index: number = packet[1] & 31

    console.log('harav !', packet.length, packet)

    if (index === Index.menu) {
      this.currentMode[Mode.main] = packet[3]
      this.currentMode[Mode.sub] = packet[4]
    } else if (index === Index.sensingResponse) {
      const face: number = (packet[1] >> 5) & 15

      if (0 <= face && face <= 5) {
        if (face === FaceColor.white) {
          this.faceCell[face][0] = (packet[3] >> 4) & 15
          this.faceCell[face][1] = packet[3] & 15
          this.faceCell[face][2] = (packet[4] >> 4) & 15
          this.faceCell[face][3] = packet[4] & 15
          this.faceCell[face][4] = (packet[5] >> 4) & 15
          this.faceCell[face][5] = packet[5] & 15
          this.faceCell[face][6] = (packet[2] >> 4) & 15
          this.faceCell[face][7] = packet[2] & 15
        } else if (face === FaceColor.yellow) {
          this.faceCell[face][0] = (packet[2] >> 4) & 15
          this.faceCell[face][1] = packet[2] & 15
          this.faceCell[face][2] = (packet[3] >> 4) & 15
          this.faceCell[face][3] = packet[3] & 15
          this.faceCell[face][4] = (packet[4] >> 4) & 15
          this.faceCell[face][5] = packet[4] & 15
          this.faceCell[face][6] = (packet[5] >> 4) & 15
          this.faceCell[face][7] = packet[5] & 15
        } else if (face === FaceColor.green) {
          this.faceCell[face][0] = (packet[3] >> 4) & 15
          this.faceCell[face][1] = packet[3] & 15
          this.faceCell[face][2] = (packet[4] >> 4) & 15
          this.faceCell[face][3] = packet[4] & 15
          this.faceCell[face][4] = (packet[5] >> 4) & 15
          this.faceCell[face][5] = packet[5] & 15
          this.faceCell[face][6] = (packet[2] >> 4) & 15
          this.faceCell[face][7] = packet[2] & 15
        } else if (face === FaceColor.blue) {
          this.faceCell[face][0] = (packet[4] >> 4) & 15
          this.faceCell[face][1] = packet[4] & 15
          this.faceCell[face][2] = (packet[5] >> 4) & 15
          this.faceCell[face][3] = packet[5] & 15
          this.faceCell[face][4] = (packet[2] >> 4) & 15
          this.faceCell[face][5] = packet[2] & 15
          this.faceCell[face][6] = (packet[3] >> 4) & 15
          this.faceCell[face][7] = packet[3] & 15
        } else if (face === FaceColor.red) {
          this.faceCell[face][0] = (packet[3] >> 4) & 15
          this.faceCell[face][1] = packet[3] & 15
          this.faceCell[face][2] = (packet[4] >> 4) & 15
          this.faceCell[face][3] = packet[4] & 15
          this.faceCell[face][4] = (packet[5] >> 4) & 15
          this.faceCell[face][5] = packet[5] & 15
          this.faceCell[face][6] = (packet[2] >> 4) & 15
          this.faceCell[face][7] = packet[2] & 15
        } else if (face === FaceColor.purple) {
          this.faceCell[face][0] = (packet[4] >> 4) & 15
          this.faceCell[face][1] = packet[4] & 15
          this.faceCell[face][2] = (packet[5] >> 4) & 15
          this.faceCell[face][3] = packet[5] & 15
          this.faceCell[face][4] = (packet[2] >> 4) & 15
          this.faceCell[face][5] = packet[2] & 15
          this.faceCell[face][6] = (packet[3] >> 4) & 15
          this.faceCell[face][7] = packet[3] & 15
        }
      } else if (face === 7) {
        this.faceCell[0][0] = (((packet[2] & 3) << 1) | ((packet[3] >> 7) & 1)) & 7
        this.faceCell[0][1] = (packet[3] >> 4) & 7
        this.faceCell[0][2] = (packet[3] >> 1) & 7
        this.faceCell[0][3] = (((packet[3] & 1) << 2) | ((packet[4] >> 6) & 3)) & 7
        this.faceCell[0][4] = (packet[4] >> 3) & 7
        this.faceCell[0][5] = packet[4] & 7
        this.faceCell[0][6] = (packet[2] >> 5) & 7
        this.faceCell[0][7] = (packet[2] >> 2) & 7

        this.faceCell[1][0] = (packet[5] >> 5) & 7
        this.faceCell[1][1] = (packet[5] >> 2) & 7
        this.faceCell[1][2] = (((packet[5] & 3) << 1) | ((packet[6] >> 7) & 1)) & 7
        this.faceCell[1][3] = (packet[6] >> 4) & 7
        this.faceCell[1][4] = (packet[6] >> 1) & 7
        this.faceCell[1][5] = (((packet[6] & 1) << 2) | ((packet[7] >> 6) & 3)) & 7
        this.faceCell[1][6] = (packet[7] >> 3) & 7
        this.faceCell[1][7] = packet[7] & 7

        this.faceCell[2][0] = (((packet[8] & 3) << 1) | ((packet[9] >> 7) & 1)) & 7
        this.faceCell[2][1] = (packet[9] >> 4) & 7
        this.faceCell[2][2] = (packet[9] >> 1) & 7
        this.faceCell[2][3] = (((packet[9] & 1) << 2) | ((packet[10] >> 6) & 3)) & 7
        this.faceCell[2][4] = (packet[10] >> 3) & 7
        this.faceCell[2][5] = packet[10] & 7
        this.faceCell[2][6] = (packet[8] >> 5) & 7
        this.faceCell[2][7] = (packet[8] >> 2) & 7

        this.faceCell[3][0] = (packet[12] >> 1) & 7
        this.faceCell[3][1] = (((packet[12] & 1) << 2) | ((packet[13] >> 6) & 3)) & 7
        this.faceCell[3][2] = (packet[13] >> 3) & 7
        this.faceCell[3][3] = packet[13] & 7
        this.faceCell[3][4] = (packet[11] >> 5) & 7
        this.faceCell[3][5] = (packet[11] >> 2) & 7
        this.faceCell[3][6] = (((packet[11] & 3) << 1) | ((packet[12] >> 7) & 1)) & 7
        this.faceCell[3][7] = (packet[12] >> 4) & 7

        this.faceCell[4][0] = (((packet[14] & 3) << 1) | ((packet[15] >> 7) & 1)) & 7
        this.faceCell[4][1] = (packet[15] >> 4) & 7
        this.faceCell[4][2] = (packet[15] >> 1) & 7
        this.faceCell[4][3] = (((packet[15] & 1) << 2) | ((packet[16] >> 6) & 3)) & 7
        this.faceCell[4][4] = (packet[16] >> 3) & 7
        this.faceCell[4][5] = packet[16] & 7
        this.faceCell[4][6] = (packet[14] >> 5) & 7
        this.faceCell[4][7] = (packet[14] >> 2) & 7

        this.faceCell[5][0] = (packet[18] >> 1) & 7
        this.faceCell[5][1] = (((packet[18] & 1) << 2) | ((packet[19] >> 6) & 3)) & 7
        this.faceCell[5][2] = (packet[19] >> 3) & 7
        this.faceCell[5][3] = packet[19] & 7
        this.faceCell[5][4] = (packet[17] >> 5) & 7
        this.faceCell[5][5] = (packet[17] >> 2) & 7
        this.faceCell[5][6] = (((packet[17] & 3) << 1) | ((packet[18] >> 7) & 1)) & 7
        this.faceCell[5][7] = (packet[18] >> 4) & 7
      }
    } else if (index === Index.faceDirection) {
      if (packet[2] === 1) {
        this.faceRotDir[0] = (packet[3] >> 4) & 15 // 흰
        this.faceRotDir[1] = packet[3] & 15 // 노
        this.faceRotDir[2] = (packet[4] >> 4) & 15 // 녹
        this.faceRotDir[3] = packet[4] & 15 // 파
        this.faceRotDir[4] = (packet[5] >> 4) & 15 // 빨
        this.faceRotDir[5] = packet[5] & 15 // 보
      }
    } else if (index === Index.recordResponse) {
      // 0: 최신, 1: 차순 ... , 5: 최고
      const recordIndex: number = (packet[1] >> 5) & 15
      console.log('harav recordIndex', packet.length, recordIndex, packet)
      this.record[recordIndex][packet[2]] = (packet[3] << 16) | (packet[4] << 8) | packet[5]
    }
  }

  private calculrateAngle(rotation: number, angle: number): number {
    return rotation === 2 ? (angle += 8) : angle
  }

  private convertEnumType(fromObj: any, toObj: any, value: any): any {
    const key: string | undefined = Object.keys(fromObj).find((key) => fromObj[key] === value)
    return key ? toObj[key] : 'undefind'
  }

  private async dividePacket(packet: Buffer) {
    let headerFlag = false
    let headerArr = 0
    for (let i = 0; i < packet.length; i++) {
      if (headerFlag === false && packet[i] === 0) {
        headerFlag = true
        headerArr = i
      }
      if (headerFlag === true && packet[i] === 90) {
        const division: Packet = []
        for (let j = headerArr; j < i + 1; j++) {
          division.push(packet[j])
        }
        await this.rQueue.enqueue(division)
        headerFlag = false
      }
    }
  }
  /**
   * implement IHwControl
   * 디바이스(serial)의 OPEN 직후에 자동으로 호출됩니다
   */
  onDeviceOpened = async (ctx: any): Promise<void> => {
    const logTag = 'ExMarsCubeControl.onDeviceOpened()'
    this.log(ctx).i(logTag, 'called')

    let count = 0

    // 변수 및 배열 초기화
    for (let i = 0; i < this.faceCell.length; i++) {
      this.faceCell[i] = new Array<number>(9)

      // Cell 번호
      // 7 0 1
      // 6 8 2
      // 5 4 3
      for (let j = 0; j < 8; j++) {
        this.faceCell[i][j] = 0
      }
      this.faceCell[i][8] = i
    }
    for (let i = 0; i < this.faceRotDir.length; i++) {
      this.faceRotDir[i] = 0
    }
    for (let i = 0; i < this.record.length; i++) {
      this.record[i] = new Array<number>(6)
      for (let j = 0; j < 6; j++) {
        this.record[i][j] = 0
      }
    }
    for (let i = 0; i < this.currentMode.length; i++) {
      this.currentMode[i] = 0
    }

    // 다양한 테스트 결과 경계값을 깔끔히 처리하면서도
    // 읽기와 동시에 쓰기 블록 실행 시 비주기적 명령 누락 현상에 대하여
    // 아직까진 최적의 해결방법인 것 같다. StartCubeLabs, 2023.03.18
    this.sendTimer = setInterval(async () => {
      if (count++ % 5 === 4) {
        this.sQueue.enqueue(this.makePacketSensingRequest())
        count = 0
      }
      if (this.sQueue.length > 0) {
        await this.write_(ctx, await this.sQueue.dequeue())
      }
    }, this.defaultDelayTime)
    await this.delay(this.defaultDelayTime / 2)
    this.receivedTimer = setInterval(async () => {
      const packet = await this.readNext_(ctx)
      if (JSON.stringify(packet) !== JSON.stringify(this.lastReadPacket)) {
        await this.dividePacket(packet)
        while (this.rQueue.length > 0) {
          await this.decodingPacket(await this.rQueue.dequeue())
        }
      }
      this.lastReadPacket = packet
    }, this.defaultDelayTime)
  }

  /**
   * implement IHwControl
   * 디바이스(serial)의 CLOSE 전에 자동으로 호출됩니다
   */
  onDeviceWillClose = async (ctx: any): Promise<void> => {
    const logTag = 'ExMarsCubeControl.onDeviceWillClose()'
    this.log(ctx).i(logTag, 'called')

    this.sQueue.clear()
    clearInterval(this.sendTimer)
    clearInterval(this.receivedTimer)
  }

  /**
   * implement IHwControl
   * 하드웨어 연결 시 자동 호출
   */
  onWebSocketConnected = async (ctx: any): Promise<void> => {
    const logTag = 'ExMarsCubeControl.onWebSocketConnected()'
    this.log(ctx).i(logTag, 'called')
  }

  /**
   * implement IHwControl
   * 웹소켓 클라이언트가 연결되었고,
   * 디바이스(serial)가 CLOSE 되기 전에 한번 호출됩니다
   */
  onWebSocketDisconnected = async (ctx: any): Promise<void> => {
    const logTag = 'ExMarsCubeControl.onWebSocketDisconnected()'
    this.log(ctx).i(logTag, 'called')

    this.sQueue.clear()
  }
}
