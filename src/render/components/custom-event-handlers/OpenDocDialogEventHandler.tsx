import React, { useEffect, useState, useCallback } from 'react'
import DocViewDialog, { DocViewDialogProps } from 'src/render/dialogs/doc-view/DocViewDialog'
import { CustomEvents } from 'src/render/lib/CustomEvents'

type DialogId = 'DocViewDialog'

export default function OpenDocDialogEventHandler() {
  const [docViewDialogProps, setDocViewDialogProps] = useState<Omit<DocViewDialogProps, 'open'>>()
  const [dialogId, setDialogId] = useState<DialogId>()

  //
  const _closeDialog = useCallback(() => {
    setDialogId(undefined)
    setDocViewDialogProps(undefined)
  }, [])

  const _openDocDialog = useCallback(
    (docId: string) => {
      setDialogId('DocViewDialog')
      setDocViewDialogProps({
        docId,
        onClose: _closeDialog,
      })
    },
    [_closeDialog],
  )

  useEffect(() => {
    const s1 = CustomEvents.doc.openDialog.observe().subscribe((payload) => {
      _openDocDialog(payload.docId)
    })

    return () => {
      s1.unsubscribe()
    }
  }, [_openDocDialog])

  if (dialogId === 'DocViewDialog' && docViewDialogProps) {
    return <DocViewDialog open={true} {...docViewDialogProps} />
  } else {
    return null
  }
}
