import { LightboxImageOpenedEvent } from 'src/render/custom-events/LightboxImageOpenedEvent'
import { Dialog, DialogProps } from '@mui/material'
import clsx from 'clsx'
import * as React from 'react'
import { useObservable } from 'react-use'

type Props = DialogProps

/**
 * CustomDialog의 용도
 * 글자 크기나 색상 등의 스타일이 설정된
 * 시스템에서 공통으로 사용할 다이얼로그다.
 *
 * 현재는 Mui의 기본 스타일을 사용하지만,
 * 여기만 변경하면 모든 다이얼로그의 스타일이 적용되도록 할 수 있다.
 */
const CustomDialog = React.forwardRef<HTMLDivElement, Props>((props: Props, ref): JSX.Element => {
  const { className, disableEscapeKeyDown, ...otherProps } = props
  const lightboxImageOpened$ = useObservable(LightboxImageOpenedEvent.observe())

  const disableEscapeKey = disableEscapeKeyDown || lightboxImageOpened$?.opened
  return (
    <Dialog
      ref={ref}
      disableEscapeKeyDown={disableEscapeKey ?? false}
      className={clsx('CustomDialog-root', className)}
      {...otherProps}
    />
  )
})

CustomDialog.displayName = 'CustomDialog'
export default CustomDialog
