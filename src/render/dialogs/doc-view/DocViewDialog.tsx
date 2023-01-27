import ArrowForwardIcon from '@mui/icons-material/ArrowForwardIos'
import AspectRatioIcon from '@mui/icons-material/AspectRatio'
import CloseIcon from '@mui/icons-material/Close'
import { Box, Dialog, DialogContent, DialogTitle, IconButton, useMediaQuery, useTheme } from '@mui/material'
import React from 'react'
import { useMeasure, useSessionStorage } from 'react-use'

export type DocViewDialogProps = {
  docId: string
  open: boolean
  onClose: () => void
}

function getDocUrl(docId: string): string {
  return `https://ktaicoder.github.io/post/${docId}?_access=pc`
}

function getDocSiteUrl(docId: string): string {
  return `https://ktaicoder.github.io/post-frame/${docId}?_access=pc`
}

export default function DocViewDialog(props: DocViewDialogProps) {
  const theme = useTheme()
  const { docId, open, onClose } = props
  const [containerRef, { height: containerHeight }] = useMeasure()
  const [expand, setExpand] = useSessionStorage<boolean>('doc.dialog-expand', true)
  const smDown = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={expand ? 'md' : 'sm'}
      fullWidth
      sx={{
        '& .MuiPaper-root': {
          background: '#FAFAFA',
        },
        '& .MuiDialog-paperScrollPaper': {
          minHeight: 'calc(100vh - 70px)',
        },
        '& .MuiDialogContent-root': {
          padding: 0,
          margin: 0,
        },
      }}
    >
      <DialogTitle style={{ padding: '8px' }}>
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: theme.spacing(0),
          }}
        >
          {!smDown && (
            <IconButton size="small" onClick={() => setExpand(!expand)}>
              <AspectRatioIcon />
            </IconButton>
          )}

          <Box
            onClick={() => window.service.native.openUrl(getDocSiteUrl(docId))}
            // href={getDocSiteUrl(docId)}
            sx={{
              marginLeft: theme.spacing(2),
              fontSize: '0.85rem',
              color: '#888',
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              '&:hover': {
                color: '#000',
              },
            }}
          >
            <span>@ktaicoder</span>
            <ArrowForwardIcon style={{ marginLeft: '8px', fontSize: '0.8rem' }} />
          </Box>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers ref={containerRef}>
        <iframe
          src={getDocUrl(docId)}
          style={{
            padding: 0,
            width: '100%',
            height: `calc( ${containerHeight}px - 10px)`,
            border: 'none',
          }}
        ></iframe>
      </DialogContent>
    </Dialog>
  )
}
