import { SxProps, Theme } from '@mui/material'

/**
 * SxProps를 flatten 한 배열로 만든다.
 * @param sxArray SxProps의 배열
 * @returns SxProps
 */
export function flatSx(...sxArray: Array<SxProps<Theme> | undefined | false | null>): SxProps<Theme> {
  return sxArray
    .filter((it) => !!it) // filter undefined
    .flatMap((sx) => (Array.isArray(sx) ? sx : [sx ?? false]))
    .filter((it) => it !== false)
}

export function firstSx(...sxArray: Array<SxProps<Theme> | undefined>) {
  return sxArray
    .filter((it) => !!it) // filter undefined
    .flatMap((sx) => (Array.isArray(sx) ? sx : [sx ?? false]))
    .filter((it) => it !== false)[0]
}

/**
 * 다이얼로그 높이 SxProps
 * @param key key of height
 * @param heightInPercent height in percent [0~100]
 * @returns Mui Dialog의 높이 설정 SxProps
 */
export const sxDialogHeight = (key: 'height' | 'minHeight' | 'maxHeight' = 'height', heightInPercent = 100) => {
  return {
    '& .MuiDialog-paperScrollPaper': {
      [key]: `calc(${heightInPercent}% - 64px)`,
    },
  }
}
