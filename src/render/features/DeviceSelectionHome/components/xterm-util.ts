import { ITerminalOptions } from 'xterm'
import chalk from 'chalk'

type TermColorFn = (s: string) => string

/**
 * 문자열을 숫자로 바꾼다.
 * hex prefix가 있으면, 16진수로 바꾸고
 * hex prefix가 없으면 defaultBase로 바꾼다
 * @param str 숫자로 바꿀 문자열
 * @param defaultBase 16 or 10
 * @param raiseError true이면 NaN일때 예외를 발생
 * @returns 변경된 숫자값 리턴
 * @example
 * toNum('0x10', 16) => 16
 * toNum('x10', 16) => 16
 * toNum('10', 16) => 16
 *
 * toNum('0x10', 10) => 16
 * toNum('x10', 10) => 16
 * toNum('10', 10) => 10
 *
 * toNum('F0', 10, false) => NaN
 * toNum('F0', 10, true) => error occured
 */
function toNum(str: string, defaultBase: 10 | 16, raiseError = false): number {
  const v = str.toLowerCase()
  let num: number
  if (v.startsWith('x')) num = parseInt(v.substring(1), 16)
  else if (v.startsWith('o')) num = parseInt(v.substring(1), 8)
  else if (v.startsWith('0x')) num = parseInt(v.substring(2), 16)
  else if (v.startsWith('0o')) num = parseInt(v.substring(2), 8)
  else num = parseInt(v, defaultBase)
  if (raiseError) {
    if (isNaN(num)) {
      throw new Error('invalid number')
    }
  }
  return num
}

export function splitToNumbers(input: string, hex: boolean, skipNaN: boolean): number[] {
  const inputStr = input.trim()
  if (inputStr.length === 0) return []
  const inputStrs = inputStr.split(/[ ,]+/)

  if (skipNaN) {
    return inputStrs
      .map((it) => toNum(it, hex ? 16 : 10, false)) //
      .filter((it) => !isNaN(it))
  }

  return inputStrs.map((it) => toNum(it, hex ? 16 : 10, true))
}

/**
 * 터미널 콘솔에 헥사값과 아스키값을 출력하는 문자열 생성
 * @param values 출력할 숫자값
 * @param maxByteCount 숫자값의 최대 바이트 개수
 * @param hexColorFn 헥사값 터미널 컬러 함수
 * @param asciiColorFn 아스키값 터미널 컬러 함수
 * @returns 터미널 문자열
 */
export function toTermHexLine(
  values: number[] | Uint8Array,
  maxByteCount: number,
  hexColorFn?: TermColorFn,
  asciiColorFn?: TermColorFn,
) {
  let arr: number[]
  if (!Array.isArray(values)) {
    arr = Array.from(values)
  } else {
    arr = values
  }

  let hexa = arr
    .map((it) => it.toString(16))
    .map((it) => (it.length === 1 ? `0${it}` : it))
    .join(' ')

  if (maxByteCount <= 0) {
    return `${hexColorFn ? hexColorFn(hexa) : hexa}`
  }

  hexa = hexa.padEnd(maxByteCount * 3 - 1, ' ') // hex값과 공백을 포함하면 3글자
  const ascii = arr
    .map((v) => {
      if (v >= 127) return '.'
      if (v < 33) return '.'

      return String.fromCharCode(v)
    })
    .join('')

  return `${hexColorFn ? hexColorFn(hexa) : hexa}  ${chalk.gray('│')} ${
    asciiColorFn ? asciiColorFn(ascii) : ascii
  }`
}

export const DEFAULT_TERM_OPTIONS: ITerminalOptions = {
  // cursorStyle: 'underline',
  disableStdin: true,
  // fontFamily: nanumGothicCoding.style.fontFamily,
  fontFamily: 'JetBrains Mono',
  fontWeight: 400,
  fontSize: 14,
  letterSpacing: 0,
  theme: {
    background: '#232323',
  },
  overviewRulerWidth: 500,
}
