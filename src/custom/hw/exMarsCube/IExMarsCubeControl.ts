export type Packet = Array<number>
export enum Color {
  off = 'O',
  red = 'R',
  green = 'G',
  blue = 'B',
  yellow = 'Y',
  purple = 'P',
  white = 'W',
  skip = 'S',
}
export enum Index {
  menu = 0,
  face = 7,
  faceDirection = 7,
  recordRequest = 8,
  recordResponse = 9,
  centerColor = 9,
  cellColor = 11,
  posDirTor = 12,
  sensingRequest = 28,
  sensingResponse = 28,
}
export enum Action {
  faceMove = 1,
  faceResetAll,
  faceMoveWithMotor,
}
export enum Rotation {
  zero,
  thirty,
  sixty,
  ninety,
  aHundredTwenty,
  aHundredFifty,
  aHundredEighty,
}
export enum FaceColor {
  white,
  yellow,
  green,
  blue,
  red,
  purple,
  all = 7,
}
export enum CellColor {
  off,
  red,
  green,
  blue,
  yellow,
  purple = 6,
  white,
  skip,
}
export enum DirectionState {
  brake,
  cw,
  ccw,
  passive,
}
export enum DirectionFromFace {
  forwardCW,
  forwardCCW,
  rightCW,
  rightCCW,
  leftCW,
  leftCCW,
  upCW,
  upCCW,
  downCW,
  donwCCW,
  backwardCW,
  backwardCCW,
}
export enum Pitch {
  C,
  CSharp,
  D,
  DSharp,
  E,
  F,
  FSharp,
  G,
  GSharp,
  A,
  ASharp,
  B,
  Rest,
}
export enum Switch {
  Off,
  On,
}
export enum Mode {
  main,
  sub,
}
export enum Record {
  normal,
  fifthRelay,
  halfBlind,
  fullBlind,
  timePenalty,
  twenty_twentyEightMode,
  minimumRotation,
  zeroTwoMode,
}
export enum PacketType {
  sendUSB = 11,
  sendByte = 7,
  received = 7,
}

/**
 * 컨트롤 인터페이스 - 클라이언트(ex: 블록코딩)에서 사용
 * 클라이언트는 이 인터페이스를 Proxy 하여 RPC 처럼 호출
 */
export interface IExMarsCubeControl {
  /**
   * face 면의 cell번 셀의 색상값
   */
  getCellColor(ctx: any, face: string, cell: string): Promise<string>

  /**
   * face 면의 셀 색상값
   */
  getFaceColor(ctx: any, face: string): Promise<string[]>

  /**
   * face 면의 회전 방향
   */
  getFaceRotationValue(ctx: any, face: string): Promise<string>

  /**
   * mode 의 record 기록
   */
  getModeRecord(ctx: any, mode: string, record: string): Promise<number>

  /**
   * diceNumber 기록
   */
  getDiceNumberRecord(ctx: any, record: string): Promise<number>

  /**
   * 모드 상태
   */
  getModeStatus(ctx: any): Promise<string>

  /**
   * 모드 빠져나오기
   */
  setMenuInit(ctx: any): Promise<void>

  /**
   * 모드를 main sub로 설정하기
   */
  setModeSetting(ctx: any, main: string, sub: string): Promise<void>

  /**
   * scale 연주 모드로 바꾸기
   */
  setPlayMode(ctx: any, scale: string): Promise<void>

  /**
   * user 펌웨어로 바꾸기
   */
  setUserMode(ctx: any, user: string): Promise<void>

  /**
   * 브레이크 기능을 flag
   */
  setNonBrake(ctx: any, flag: string): Promise<void>

  /**
   * 모든 색상을 초기화하기
   */
  setResetAllFace(ctx: any): Promise<void>

  /**
   * 모든 회전값을 초기화하기
   */
  setResetRotation(ctx: any): Promise<void>

  /**
   * face 면의 가운데 셀 LED 색상을 color 으로 바꾸기
   */
  setCenterColorChange(ctx: any, face: string, color: string): Promise<void>

  /**
   * face 면의 셀 색상을 color 으로 바꾸기
   */
  setCellColorChange(
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
  ): Promise<void>

  /**
   * faceIndex 면을 postion 포지션, rotationDirection 방향, torque 토크로 바꾸기
   */
  setPositionDirectionTorqueChange(
    ctx: any,
    face: string,
    position: string,
    rotationDirection: string,
    torque: string,
  ): Promise<void>

  /**
   * faceIndex 면의 LED 색상을 rotationDirection 방향으로 angle º 만큼 회전하기
   */
  setFaceRotationOnlyColor(ctx: any, face: string, rotationDirection: string, angle: string): Promise<void>

  /**
   * face 면을 rotationDirection 방향으로 angle º 만큼 회전하기
   */
  setFaceRotation(ctx: any, face: string, rotationDirection: string, angle: string): Promise<void>

  /**
   * face1 면을 rotationDirection 방향으로 angle1 º 만큼, face2 면을 rotationDirection2 방향으로 angle2 º 만큼 회전하기
   */
  setFacesRotation(
    ctx: any,
    face1: string,
    rotationDirection1: string,
    angle1: string,
    face2: string,
    rotationDirection2: string,
    angle2: string,
  ): Promise<void>

  /**
   * faceColor 을 앞면으로 faceLocation 를 seconds 초 동안 풀기
   */
  setSolveCube(ctx: any, faceColor: string, faceLocation: string, seconds: string): Promise<void>

  /**
   * pitchName 을 seconds 초 연주하기
   */
  setPlayNote(ctx: any, pitchName: string, seconds: string): Promise<void>

  /**
   * mode 기록 가져오기
   */
  setReturnModeRecord(ctx: any, mode: string): Promise<void>

  /**
   * 주사위 숫자를 %1 로 바로 시작하기
   */
  setDiceStart(ctx: any, dice: string): Promise<void>

  /**
   * 주사위 숫자 기록 가져오기
   */
  setReturnDiceNumberRecord(ctx: any): Promise<void>

  /**
   * 자동 솔빙 시작
   */
  setAutoSolveCube(ctx: any): Promise<void>
}
