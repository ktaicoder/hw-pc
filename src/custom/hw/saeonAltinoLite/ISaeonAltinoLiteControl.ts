import { IHwControl } from 'src/custom-types'

/**
 * 컨트롤 인터페이스 - 클라이언트(ex: 블록코딩)에서 사용
 * 클라이언트는 이 인터페이스를 Proxy 하여 RPC 처럼 호출
 */
export interface ISaeonAltinoLiteControl extends IHwControl {
  /**
   * 정지
   * option : All
   * option : Drive
   * option : Steering
   * option : Sound
   * option : Light
   * option : Display
   */
  stop(ctx: any, option: string): Promise<void>

  /**
   * 뒷바퀴 구동
   */
  go(ctx: any, lp: number, rp: number): Promise<void>

  /**
   * 조향
   * option : Center
   * option : Left-5
   * option : Left-10
   * option : Left-15
   * option : Left-20
   * option : Right-5
   * option : Right-10
   * option : Right-15
   * option : Right-20
   */
  steering(ctx: any, option: string): Promise<void>

  /**
   * 조향
   * val : steering value (-127 ~ 127)
   */
  steeringNumber(ctx: any, val: number): Promise<void>

  /**
   * 센서
   * option : CDS
   * option : IR1
   * option : IR2
   * option : IR3
   * option : IR4
   * option : IR5
   * option : IR6
   * option : BAT
   */
  sensor(ctx: any, option: string): Promise<number>

  /**
   * 라이트
   * fn : Forward
   * fn : Turn left
   * fn : Turn right
   * fn : Brake
   * state : On
   * state : Off
   */
  light(ctx: any, fn: string, state: string): Promise<void>

  /**
   * 라이트
   * hex : light hex value
   */
  lightHex(ctx: any, hex: string): Promise<void>

  /**
   * 소리
   * oct : 1-Oct
   * oct : 2-Oct
   * oct : 3-Oct
   * oct : 4-Oct
   * oct : 5-Oct
   * oct : 6-Oct
   * oct : 7-Oct
   * oct : 8-Oct
   * scale : C (Do)
   * scale : C# (Do#)
   * scale : D (Re)
   * scale : D# (Re#)
   * scale : E (Mi)
   * scale : F (Fa)
   * scale : F# (Fa#)
   * scale : G (Sol)
   * scale : G# (Sol#)
   * scale : A (La)
   * scale : A# (La#)
   * scale : B (Si)
   * scale : Non
   */
  sound(ctx: any, oct: string, scale: string): Promise<void>

  /**
   * 소리
   * scale : scale value (0 ~ 255)
   */
  soundNumber(ctx: any, scale: number): Promise<void>

  /**
   * 표시하기
   * ch : char value
   */
  displayChar(ctx: any, ch: string): Promise<void>

  /**
   * 표시하기
   * line : Line-1
   * line : Line-2
   * line : Line-3
   * line : Line-4
   * line : Line-5
   * line : Line-6
   * line : Line-7
   * line : Line-8
   * bit0 : On
   * bit0 : Off
   * bit1 : On
   * bit1 : Off
   * bit2 : On
   * bit2 : Off
   * bit3 : On
   * bit3 : Off
   * bit4 : On
   * bit4 : Off
   * bit5 : On
   * bit5 : Off
   * bit6 : On
   * bit6 : Off
   * bit7 : On
   * bit7 : Off
   */
  displayLine(
    ctx: any,
    line: string,
    bit0: string,
    bit1: string,
    bit2: string,
    bit3: string,
    bit4: string,
    bit5: string,
    bit6: string,
    bit7: string,
  ): Promise<void>

  /**
   * 표시하기
   * line1 : hex value
   * line2 : hex value
   * line3 : hex value
   * line4 : hex value
   * line5 : hex value
   * line6 : hex value
   * line7 : hex value
   * line8 : hex value
   */
  display(
    ctx: any,
    line1: string,
    line2: string,
    line3: string,
    line4: string,
    line5: string,
    line6: string,
    line7: string,
    line8: string,
  ): Promise<void>

  /**
   * 표시하기 켜기
   */
  display_on(ctx: any, x: number, y: number): Promise<void>

  /**
   * 표시하기 끄기
   */
  display_off(ctx: any, x: number, y: number): Promise<void>
}
