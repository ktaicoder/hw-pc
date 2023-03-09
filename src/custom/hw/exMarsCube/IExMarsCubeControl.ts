import { HardwareDescriptor, IHwControl } from 'src/custom-types'

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

export enum Direction {
  brake,
  cw,
  ccw,
  passive,
}

export enum Mode {
  main,
  sub,
}

/**
 * 컨트롤 인터페이스 - 클라이언트(ex: 블록코딩)에서 사용
 * 클라이언트는 이 인터페이스를 Proxy 하여 RPC 처럼 호출
 */
export interface IExMarsCubeControl extends IHwControl {
  /**
   * face 면의 cell번 셀의 색상값
   */
  getCellColor(face: string, cell: string): Promise<string>

  /**
   * face 면의 셀 색상값
   */
  getFaceColor(face: string): Promise<string[]>

  /**
   * face 면의 회전 방향
   */
  getFaceRotationValue(face: string): Promise<string>

  /**
   * mode 의 record 기록
   */
  getModeRecord(mode: string, record: string): Promise<number>

  /**
   * diceNumber 기록
   */
  getDiceNumberRecord(record: string): Promise<number>

  /**
   * 모드 상태
   */
  getModeStatus(): Promise<string>

  /**
   * 모드 빠져나오기
   */
  setMenuInit(): Promise<void>

  /**
   * 모드를 main sub로 설정하기
   */
  setModeSetting(main: string, sub: string): Promise<void>

  /**
   * scale 연주 모드로 바꾸기
   */
  setPlayMode(scale: string): Promise<void>

  /**
   * user 펌웨어로 바꾸기
   */
  setUserMode(user: string): Promise<void>

  /**
   * 브레이크 기능을 flag
   */
  setNonBrake(flag: string): Promise<void>

  /**
   * 모든 색상을 초기화하기
   */
  setResetAllFace(): Promise<void>

  /**
   * face 면의 가운데 셀 LED 색상을 color 으로 바꾸기
   */
  setCenterColorChange(face: string, color: string): Promise<void>

  /**
   * face 면의 셀 색상을 color 으로 바꾸기
   */
  setCellColorChange(
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
    face: string,
    position: string,
    rotationDirection: string,
    torque: string,
  ): Promise<void>

  /**
   * faceIndex 면의 LED 색상을 rotationDirection 방향으로 angle º 만큼 회전하기
   */
  setFaceRotationOnlyColor(face: string, rotationDirection: string, angle: string): Promise<void>

  /**
   * face 면을 rotationDirection 방향으로 angle º 만큼 회전하기
   */
  setFaceRotation(face: string, rotationDirection: string, angle: string): Promise<void>

  /**
   * face1 면을 rotationDirection 방향으로 angle1 º 만큼, face2 면을 rotationDirection2 방향으로 angle2 º 만큼 회전하기
   */
  setFacesRotation(
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
  setSolveCube(faceColor: string, faceLocation: string, seconds: string): Promise<void>

  /**
   * pitchName 을 seconds 초 연주하기
   */
  setPlayNote(pitchName: string, seconds: string): Promise<void>

  /**
   * mode 기록 가져오기
   */
  setReturnModeRecord(mode: string): Promise<void>

  /**
   * 주사위 숫자 기록 가져오기
   */
  setReturnDiceNumberRecord(): Promise<void>

  /**
   * 자동 솔빙 시작
   */
  setAutoSolveCube(): Promise<void>

  // 자동 호출 함수
  onAfterOpen(): Promise<void>
  onBeforeClose(): Promise<void>
}

/**
 * 하드웨어 디스크립터: commands
 * 변수이름을 hwId인 exMarsCube로 해야 함
 */
export const exMarsCube: HardwareDescriptor = {
  commands: [
    'getCellColor',
    'getFaceColor',
    'getFaceRotationValue',
    'getModeRecord',
    'getDiceNumberRecord',
    'getModeStatus',
    'setMenuInit',
    'setModeSetting',
    'setPlayMode',
    'setUserMode',
    'setNonBrake',
    'setResetAllFace',
    'setCenterColorChange',
    'setCellColorChange',
    'setPositionDirectionTorqueChange',
    'setFaceRotationOnlyColor',
    'setFaceRotation',
    'setFacesRotation',
    'setSolveCube',
    'setPlayNote',
    'setReturnModeRecord',
    'setReturnDiceNumberRecord',
    'setAutoSolveCube',
    // 자동 호출 함수
    'onAfterOpen',
    'onBeforeClose',
  ],
}
