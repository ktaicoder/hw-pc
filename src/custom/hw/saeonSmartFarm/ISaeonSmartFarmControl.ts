/**
 * 컨트롤 인터페이스 - 클라이언트(ex: 블록코딩)에서 사용
 * 클라이언트는 이 인터페이스를 Proxy 하여 RPC 처럼 호출
 */
export interface ISaeonSmartFarmControl {
  /**
   * 정지
   * option : All
   * option : Window
   * option : Fan
   * option : Pump
   * option : Heater
   * option : Cam
   * option : Led
   * option : Display
   */
  stop(ctx: any, option: string): Promise<void>

  /**
   * 창문
   * option : Open
   * option : Close
   */
  window(ctx: any, option: string): Promise<void>

  /**
   * 팬
   * option : On
   * option : Off
   */
  fan(ctx: any, option: string): Promise<void>

  /**
   * 조향
   * option : On
   * option : Off
   */
  pump(ctx: any, option: string): Promise<void>

  /**
   * 히터
   * option : On
   * option : Off
   */
  heater(ctx: any, option: string): Promise<void>

  /**
   * 카메라
   * angle : angle value (0 ~ 15)
   */
  cam(ctx: any, angle: number): Promise<void>

  /**
   * 센서
   * option : HUM
   * option : HEATER
   * option : TEMP
   * option : SOIL
   * option : CDS
   */
  sensor(ctx: any, option: string): Promise<number>

  /**
   * 조명
   * idx : idx value (1 ~ 4)
   * red : red value (0 ~ 15)
   * green : green value (0 ~ 15)
   * blue : blue value (0 ~ 15)
   */
  led(ctx: any, idx: string, red: string, green: string, blue: string): Promise<void>

  /**
   * 조명
   * idx : idx value
   * red : red value
   * green : green value
   * blue : blue value
   */
  ledNumber(ctx: any, idx: number, red: number, green: number, blue: number): Promise<void>

  /**
   * 표시하기
   * st : light hex value
   */
  display(ctx: any, st: string): Promise<void>

  /**
   * 스위치
   * idx : 1
   * idx : 2
   * idx : 3
   */
  // switch(ctx: any, idx: string): Promise<boolean>
}
