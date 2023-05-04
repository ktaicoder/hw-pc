import {
  BehaviorSubject,
  EMPTY,
  filter,
  map,
  Observable,
  sampleTime,
  Subscription,
  switchMap,
  take,
  takeUntil,
} from 'rxjs'
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
  PacketDelimiter,
  PacketType,
  Pitch,
  Record,
  Rotation,
  Switch,
} from './IExMarsCubeControl'

/**
 * 하드웨어 제어
 */
export class ExMarsCubeControl extends AbstractHwConrtol implements IExMarsCubeControl {
  private faceCell: Array<Packet> = new Array(6)
  private faceRotDir: Packet = new Array(6)
  private record: Array<Packet> = new Array(8)
  private currentMode: Packet = new Array(2)

  private readonly sendPacketType: number = PacketType.sendByte
  private stopped$ = new BehaviorSubject(false)
  private rxSubscription_: Subscription | undefined = undefined

  async getCellColor(ctx: any, face: string, cell: string): Promise<string> {
    const value: number = this.faceCell[parseInt(face)][parseInt(cell)]

    const buffer = this.texPacketSensingRequest()
    await this.write_(ctx, buffer)

    return this.convertEnumType(parseInt(cell) < 8 ? CellColor : FaceColor, Color, value).toString()
  }

  async getFaceColor(ctx: any, face: string): Promise<string[]> {
    const colors: Array<string> = new Array<string>(9)
    for (let cell = 0; cell < 9; cell++) {
      const value: number = this.faceCell[parseInt(face)][cell]
      colors[cell] = this.convertEnumType(cell < 8 ? CellColor : FaceColor, Color, value).toString()
    }

    const buffer = this.texPacketSensingRequest()
    await this.write_(ctx, buffer)

    return colors
  }

  async getFaceRotationValue(ctx: any, face: string): Promise<string> {
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
    return Math.floor(this.record[parseInt(mode)][parseInt(record)]) / 1000 // value / 10 / 100(%)
  }

  async getDiceNumberRecord(ctx: any, record: string): Promise<number> {
    return Math.floor(this.record[Record.zeroTwoMode][parseInt(record)]) / 1000 // value / 10 / 100(%)
  }

  async getModeStatus(ctx: any): Promise<string> {
    const status = `${this.currentMode[Mode.main]}${this.currentMode[Mode.sub]}`
    return status
  }

  async setMenuInit(ctx: any): Promise<void> {
    const buffer: Packet = this.texPacketMenuSetting(10, 10)
    await this.write_(ctx, buffer)
    await this.delay()
  }

  async setModeSetting(ctx: any, main: string, sub: string): Promise<void> {
    const buffer: Packet = this.texPacketMenuSetting(parseInt(main), parseInt(sub))
    await this.write_(ctx, buffer)
    await this.delay()
  }

  async setPlayMode(ctx: any, scale: string): Promise<void> {
    const buffer: Packet = this.texPacketModeSetting(3, parseInt(scale))
    await this.write_(ctx, buffer)
    await this.delay()
  }

  async setUserMode(ctx: any, user: string): Promise<void> {
    const buffer: Packet = this.texPacketModeSetting(1, parseInt(user))
    await this.write_(ctx, buffer)
    await this.delay()
  }

  async setNonBrake(ctx: any, flag: string): Promise<void> {
    let buffer: Packet = new Array<number>(this.sendPacketType)
    switch (parseInt(flag)) {
      case Switch.Off:
        buffer = this.texPacketMenuSetting(13, 4)
        break
      case Switch.On:
        buffer = this.texPacketMenuSetting(9, 3)
        break
    }
    await this.write_(ctx, buffer)
    await this.delay()
  }

  async setResetAllFace(ctx: any): Promise<void> {
    const buffer: Packet = this.texPacketResetAllFace()
    await this.write_(ctx, buffer)
    await this.delay()
  }

  async setResetRotation(ctx: any): Promise<void> {
    for (let i = 0; i < this.faceRotDir.length; i++) {
      this.faceRotDir[i] = 0
    }
    await this.delay()
  }

  async setCenterColorChange(ctx: any, face: string, color: string): Promise<void> {
    const buffer: Packet = this.texPacketSetCenterColor(parseInt(face), parseInt(color))
    await this.write_(ctx, buffer)
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
    const buffer: Packet = this.texPacketSetCellColor(
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
    await this.write_(ctx, buffer)
    await this.delay()
  }

  async setPositionDirectionTorqueChange(
    ctx: any,
    face: string,
    position: string,
    rotationDirection: string,
    torque: string,
  ): Promise<void> {
    const buffer: Packet = this.texPacketSetPosDirTor(
      parseInt(face),
      parseInt(position),
      parseInt(rotationDirection),
      parseInt(torque),
    )
    await this.write_(ctx, buffer)
    await this.delay()
  }

  async setFaceRotationOnlyColor(ctx: any, face: string, rotationDirection: string, angle: string): Promise<void> {
    const buffer: Packet = this.texPacketMoveFace(
      parseInt(face),
      this.calculrateAngle(parseInt(rotationDirection), parseInt(angle)),
    )
    await this.write_(ctx, buffer)
    await this.delay()
  }

  async setFaceRotation(ctx: any, face: string, rotationDirection: string, angle: string): Promise<void> {
    const buffer: Packet = this.texPacketFaceMoveWithMotor(
      parseInt(face),
      this.calculrateAngle(parseInt(rotationDirection), parseInt(angle)),
    )
    await this.write_(ctx, buffer)
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
    const buffer: Packet = this.texPacketFacesMoveWithMotor(
      parseInt(face1),
      this.calculrateAngle(parseInt(rotationDirection1), parseInt(angle1)),
      parseInt(face2),
      this.calculrateAngle(parseInt(rotationDirection2), parseInt(angle2)),
    )
    await this.write_(ctx, buffer)
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
    const buffer: Packet = this.texPacketFaceMoveWithMotor(face, angle)
    await this.write_(ctx, buffer)
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

      const buffer: Packet = this.texPacketFaceMoveWithMotor(face, angle)
      await this.write_(ctx, buffer)
      await this.delay(parseFloat(seconds) * 1000)
    }
  }
  async setReturnModeRecord(ctx: any, mode: string): Promise<void> {
    const buffer: Packet = this.texPacketRecord(parseInt(mode))
    await this.write_(ctx, buffer)
    await this.delay()
  }

  async setDiceStart(ctx: any, dice: string): Promise<void> {
    const buffer: Packet = this.texPacketDiceStart(parseInt(dice))
    await this.write_(ctx, buffer)
    await this.delay()
  }

  async setReturnDiceNumberRecord(ctx: any): Promise<void> {
    const buffer: Packet = this.texPacketRecord(Record.zeroTwoMode)
    await this.write_(ctx, buffer)
    await this.delay()
  }

  async setAutoSolveCube(ctx: any): Promise<void> {
    const buffer: Packet = this.texPacketRecord(7)
    await this.write_(ctx, buffer)
    await this.delay()
  }

  async setReturnCallCellColor(ctx: any): Promise<void> {
    const buffer = this.texPacketSensingRequest()
    await this.write_(ctx, buffer)
    await this.delay()
  }

  /**
   * 패킷 생성
   */
  private txPacket(index: number, param1: number, param2: number, param3: number, param4: number): Packet {
    const buffer: Packet = new Array<number>(this.sendPacketType)

    buffer[0] = PacketDelimiter.header
    buffer[1] = index
    buffer[2] = param1
    buffer[3] = param2
    buffer[4] = param3
    buffer[5] = param4
    buffer[6] = PacketDelimiter.terminator

    return buffer
  }

  private texPacketMenuSetting(main: number, sub: number): Packet {
    return this.txPacket(Index.menu, 11, main, sub, 255)
  }

  private texPacketModeSetting(index: number, mode: number): Packet {
    return this.txPacket(Index.menu, 30, index, mode, 255)
  }

  private texPacketSetCenterColor(face: number, color: number): Packet {
    const index: number = (face << 5) | Index.centerColor

    return this.txPacket(index, color, 0, 0, 0)
  }

  private texPacketSetCellColor(
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

    return this.txPacket(index, para1, para2, para3, para4)
  }

  private texPacketSetPosDirTor(face: number, position: number, direction: number, torque: number): Packet {
    const index: number = (face << 5) | Index.posDirTor
    let pos = 0

    if (position < 2) {
      pos = 2
    } else if (position > 141) {
      pos = 141
    } else {
      pos = position
    }

    return this.txPacket(index, pos, direction, torque, 0)
  }

  private texPacketMoveFace(face: number, rotation: number): Packet {
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
      buffer = this.txPacket(Index.face, Action.faceMove, para, 0, 0)
    } else if (face === FaceColor.green || face === FaceColor.blue) {
      buffer = this.txPacket(Index.face, Action.faceMove, 0, para, 0)
    } else if (face === FaceColor.red || face === FaceColor.purple) {
      buffer = this.txPacket(Index.face, Action.faceMove, 0, 0, para)
    }

    return buffer
  }

  private texPacketResetAllFace(): Packet {
    return this.txPacket(Index.face, Action.faceResetAll, 0, 0, 0)
  }

  private texPacketFaceMoveWithMotor(face: number, rotation: number): Packet {
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
      buffer = this.txPacket(Index.face, Action.faceMoveWithMotor, para, 0, 0)
    } else if (face === FaceColor.green || face === FaceColor.blue) {
      buffer = this.txPacket(Index.face, Action.faceMoveWithMotor, 0, para, 0)
    } else if (face === FaceColor.red || face === FaceColor.purple) {
      buffer = this.txPacket(Index.face, Action.faceMoveWithMotor, 0, 0, para)
    }

    return buffer
  }

  private texPacketFacesMoveWithMotor(face1: number, rotation1: number, face2: number, rotation2: number): Packet {
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

    return this.txPacket(Index.face, Action.faceMoveWithMotor, para2, para3, para4)
  }

  private texPacketDiceStart(dice: number): Packet {
    const index: number = Index.menu
    return this.txPacket(index, 21, dice, 255, 255)
  }

  private texPacketRecord(recordIndex: number): Packet {
    const index: number = (7 << 5) | Index.recordRequest
    return this.txPacket(index, recordIndex, 255, 255, 255)
  }

  private texPacketSensingRequest(): Packet {
    const index: number = (FaceColor.all << 5) | Index.sensingRequest
    return this.txPacket(index, 255, 255, 255, 255)
  }

  private async rxParser(packet: Packet | Buffer): Promise<void> {
    const index: number = packet[1] & 31

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
        this.faceCell[FaceColor.white][0] = (((packet[2] & 3) << 1) | ((packet[3] >> 7) & 1)) & 7
        this.faceCell[FaceColor.white][1] = (packet[3] >> 4) & 7
        this.faceCell[FaceColor.white][2] = (packet[3] >> 1) & 7
        this.faceCell[FaceColor.white][3] = (((packet[3] & 1) << 2) | ((packet[4] >> 6) & 3)) & 7
        this.faceCell[FaceColor.white][4] = (packet[4] >> 3) & 7
        this.faceCell[FaceColor.white][5] = packet[4] & 7
        this.faceCell[FaceColor.white][6] = (packet[2] >> 5) & 7
        this.faceCell[FaceColor.white][7] = (packet[2] >> 2) & 7

        this.faceCell[FaceColor.yellow][0] = (packet[5] >> 5) & 7
        this.faceCell[FaceColor.yellow][1] = (packet[5] >> 2) & 7
        this.faceCell[FaceColor.yellow][2] = (((packet[5] & 3) << 1) | ((packet[6] >> 7) & 1)) & 7
        this.faceCell[FaceColor.yellow][3] = (packet[6] >> 4) & 7
        this.faceCell[FaceColor.yellow][4] = (packet[6] >> 1) & 7
        this.faceCell[FaceColor.yellow][5] = (((packet[6] & 1) << 2) | ((packet[7] >> 6) & 3)) & 7
        this.faceCell[FaceColor.yellow][6] = (packet[7] >> 3) & 7
        this.faceCell[FaceColor.yellow][7] = packet[7] & 7

        this.faceCell[FaceColor.green][0] = (((packet[8] & 3) << 1) | ((packet[9] >> 7) & 1)) & 7
        this.faceCell[FaceColor.green][1] = (packet[9] >> 4) & 7
        this.faceCell[FaceColor.green][2] = (packet[9] >> 1) & 7
        this.faceCell[FaceColor.green][3] = (((packet[9] & 1) << 2) | ((packet[10] >> 6) & 3)) & 7
        this.faceCell[FaceColor.green][4] = (packet[10] >> 3) & 7
        this.faceCell[FaceColor.green][5] = packet[10] & 7
        this.faceCell[FaceColor.green][6] = (packet[8] >> 5) & 7
        this.faceCell[FaceColor.green][7] = (packet[8] >> 2) & 7

        this.faceCell[FaceColor.blue][0] = (packet[12] >> 1) & 7
        this.faceCell[FaceColor.blue][1] = (((packet[12] & 1) << 2) | ((packet[13] >> 6) & 3)) & 7
        this.faceCell[FaceColor.blue][2] = (packet[13] >> 3) & 7
        this.faceCell[FaceColor.blue][3] = packet[13] & 7
        this.faceCell[FaceColor.blue][4] = (packet[11] >> 5) & 7
        this.faceCell[FaceColor.blue][5] = (packet[11] >> 2) & 7
        this.faceCell[FaceColor.blue][6] = (((packet[11] & 3) << 1) | ((packet[12] >> 7) & 1)) & 7
        this.faceCell[FaceColor.blue][7] = (packet[12] >> 4) & 7

        this.faceCell[FaceColor.red][0] = (((packet[14] & 3) << 1) | ((packet[15] >> 7) & 1)) & 7
        this.faceCell[FaceColor.red][1] = (packet[15] >> 4) & 7
        this.faceCell[FaceColor.red][2] = (packet[15] >> 1) & 7
        this.faceCell[FaceColor.red][3] = (((packet[15] & 1) << 2) | ((packet[16] >> 6) & 3)) & 7
        this.faceCell[FaceColor.red][4] = (packet[16] >> 3) & 7
        this.faceCell[FaceColor.red][5] = packet[16] & 7
        this.faceCell[FaceColor.red][6] = (packet[14] >> 5) & 7
        this.faceCell[FaceColor.red][7] = (packet[14] >> 2) & 7

        this.faceCell[FaceColor.purple][0] = (packet[18] >> 1) & 7
        this.faceCell[FaceColor.purple][1] = (((packet[18] & 1) << 2) | ((packet[19] >> 6) & 3)) & 7
        this.faceCell[FaceColor.purple][2] = (packet[19] >> 3) & 7
        this.faceCell[FaceColor.purple][3] = packet[19] & 7
        this.faceCell[FaceColor.purple][4] = (packet[17] >> 5) & 7
        this.faceCell[FaceColor.purple][5] = (packet[17] >> 2) & 7
        this.faceCell[FaceColor.purple][6] = (((packet[17] & 3) << 1) | ((packet[18] >> 7) & 1)) & 7
        this.faceCell[FaceColor.purple][7] = (packet[18] >> 4) & 7
      }
    } else if (index === Index.faceDirection) {
      if (packet[2] === 1) {
        this.faceRotDir[FaceColor.white] = (packet[3] >> 4) & 15
        this.faceRotDir[FaceColor.yellow] = packet[3] & 15
        this.faceRotDir[FaceColor.green] = (packet[4] >> 4) & 15
        this.faceRotDir[FaceColor.blue] = packet[4] & 15
        this.faceRotDir[FaceColor.red] = (packet[5] >> 4) & 15
        this.faceRotDir[FaceColor.purple] = packet[5] & 15
      }
    } else if (index === Index.recordResponse) {
      // 0: 최신, 1: 차순 ... , 5: 최고
      const recordIndex: number = (packet[1] >> 5) & 15
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

  /**
   * 서로 다른 패킷이 한 배열로 반환될 경우 패킷별로 분할 됨.
   */
  private async dividePacket(packet: Buffer): Promise<void> {
    let headerFlag = false
    let headerArr = 0
    for (let i = 0; i < packet.length; i++) {
      if (headerFlag === false && packet[i] === PacketDelimiter.header) {
        headerFlag = true
        headerArr = i
      }
      if (headerFlag === true && packet[i] === PacketDelimiter.terminator) {
        const result: Packet = []
        for (let j = headerArr; j < i + 1; j++) {
          result.push(packet[j])
        }
        await this.rxParser(result)
        headerFlag = false
      }
    }
  }

  private rxLoop(ctx: any): void {
    const logTag = 'exMarsCube.rxLoop()'
    this.log(ctx).i(logTag, 'start')

    const device = this.device_(ctx)
    this.rxSubscription_ = device
      .observeOpenedOrNot()
      .pipe(
        switchMap((opened) => {
          if (opened) {
            return device.observeReceivedData()
          } else {
            return EMPTY
          }
        }),
        sampleTime(20),
        map((it) => it.dataBuffer),
        takeUntil(this.closeTrigger()),
      )
      .subscribe((buf) => {
        if (this.stopped$.value) {
          this.log(ctx).i(logTag, 'stop')
          return
        }
        this.dividePacket(buf)
      })
  }

  private closeTrigger = (): Observable<any> => {
    return this.stopped$.pipe(
      filter((it) => it === true),
      take(1),
    )
  }

  delay(ms?: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms ? ms + 20 : 20)
    })
  }

  /**
   * implement IHwControl
   * 디바이스(serial)의 OPEN 직후에 자동으로 호출됩니다
   */
  onDeviceOpened = async (ctx: any): Promise<void> => {
    const logTag = 'ExMarsCubeControl.onDeviceOpened()'
    this.log(ctx).i(logTag, 'called')

    // 변수 및 배열 초기화
    for (let i = 0; i < this.faceCell.length; i++) {
      this.faceCell[i] = new Array<number>(9)
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

    // 수신 시작
    this.rxLoop(ctx)
  }

  /**
   * implement IHwControl
   * 디바이스(serial)의 CLOSE 전에 자동으로 호출됩니다
   */
  onDeviceWillClose = async (ctx: any): Promise<void> => {
    const logTag = 'ExMarsCubeControl.onDeviceWillClose()'
    this.log(ctx).i(logTag, 'called')
    this.stopped$.next(true)

    if (this.rxSubscription_) {
      this.rxSubscription_.unsubscribe()
      this.rxSubscription_ = undefined
    }
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
  }
}
