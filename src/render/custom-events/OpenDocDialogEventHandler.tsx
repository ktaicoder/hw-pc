import { useCallback, useEffect, useState } from 'react'
import DocViewDialog, { DocViewDialogProps } from 'src/render/dialogs/DocViewDialog'
import { OpenDocDialogEvent } from './OpenDocDialogEvent'

type DialogId = 'DocViewDialog'

export default function OpenDocDialogEventHandler() {
  const [docViewDialogProps, setDocViewDialogProps] = useState<DocViewDialogProps>()
  const [dialogId, setDialogId] = useState<DialogId>()

  //
  const handleCloseDialog = useCallback(() => {
    setDialogId(undefined)
    setDocViewDialogProps(undefined)
  }, [])

  const openDocDialog = useCallback(
    (docId: string) => {
      setDialogId('DocViewDialog')
      setDocViewDialogProps({
        open: true,
        docId,
        onClose: handleCloseDialog,
      })
    },
    [handleCloseDialog],
  )

  useEffect(() => {
    const s1 = OpenDocDialogEvent.observe().subscribe((payload) => {
      openDocDialog(payload.docId)
    })

    return () => {
      s1.unsubscribe()
    }
  }, [openDocDialog])

  if (dialogId === 'DocViewDialog' && docViewDialogProps) {
    return <DocViewDialog {...docViewDialogProps} />
  }

  return null
}
