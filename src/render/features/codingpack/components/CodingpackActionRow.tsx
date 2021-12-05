import { toast } from 'react-toastify'
import React from 'react'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { Box, Button, ButtonBase, SvgIconProps, SxProps, Typography } from '@mui/material'
import WifiIcon from '@mui/icons-material/Wifi'
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded'
import BluetoothRoundedIcon from '@mui/icons-material/BluetoothRounded'
import PowerSettingsNewRoundedIcon from '@mui/icons-material/PowerSettingsNewRounded'
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded'
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded'
import AutoFixNormalRoundedIcon from '@mui/icons-material/AutoFixNormalRounded'
import { CodingpackActionKindKey } from 'src/domain/codingpack'
import { ChevronRight } from '@mui/icons-material'
import { CustomEvents } from 'src/render/lib/CustomEvents'
import { HwKind } from 'src/custom-types'
import Image from 'src/render/components/Image'

type Props = {
    disabled: boolean
    kind: CodingpackActionKindKey
    title: React.ReactNode
    subtitle: React.ReactNode
    docId: string
    sx?: SxProps
    onClick: () => void
}

const KindIcon = (props: { kind: CodingpackActionKindKey } & SvgIconProps) => {
    const { kind, sx, ...restProps } = props
    switch (kind) {
        case 'wifi':
            return <WifiIcon {...restProps} />
        case 'bluetooth':
            return <BluetoothRoundedIcon {...restProps} />
        case 'pw':
            return <AccountCircleRoundedIcon {...restProps} />
        case 'reboot':
            return <PowerSettingsNewRoundedIcon {...restProps} />
        case 'audio':
            return <VolumeUpRoundedIcon {...restProps} />
        case 'upgrade':
            return <AutoFixHighRoundedIcon {...restProps} />
        case 'update':
            return <AutoFixNormalRoundedIcon {...restProps} />
        case 'rescue':
            return <AutoAwesomeIcon {...restProps} />
        default:
            return <WifiIcon {...restProps} />
    }
}

const tintOfKind = (kind: CodingpackActionKindKey) => {
    switch (kind) {
        case 'wifi':
            return '#F4AF7A'
        case 'bluetooth':
            return '#FBA0A5'
        case 'pw':
            return '#FBA0A5'
        case 'reboot':
            return '#F8CE61'
        case 'audio':
            return '#FBA0A5'
        case 'upgrade':
            return '#88CFBB'
        case 'update':
            return '#80BCE5'
        case 'rescue':
            return '#F8CE61'
        default:
            return '#F4AF7A'
    }
}

export default function CodingpackActionRow(props: Props) {
    const { disabled, sx, docId, onClick, title, subtitle, kind } = props
    return (
        <ButtonBase
            component="div"
            onClick={onClick}
            sx={{
                overflow: 'hidden',
                border: '1px solid #ddd',
                borderRadius: '8px',
                background: '#fff',
                '& em': {
                    fontStyle: 'normal',
                    // color: 'secondary.main',
                    color: 'text.main',
                    fontWeight: 700,
                },
                ...sx,
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    minHeight: '110px',
                    p: 2,
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    maxWidth: '440px',
                    minWidth: '440px',
                    mx: 'auto',
                }}
            >
                <Box
                    sx={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Image
                        sx={{
                            width: '100%',
                            border: '0px solid #ccc',
                            objectFit: 'contain',
                            ...(disabled && { filter: 'grayscale(80%)' }),
                        }}
                        src={`static/images/codingpack/codingpack_${kind}.png`}
                    />
                    {/* <KindIcon kind={kind} sx={{ fontSize: '2rem', color: tintOfKind(kind) }} /> */}
                </Box>
                <Box ml={5} flex={1}>
                    <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                flex: 1,
                                color: '#0A1929',
                                fontWeight: disabled ? 400 : 700,
                                fontSize: '1.05rem',
                            }}
                        >
                            {title}
                        </Typography>
                        {/* <Button
                        endIcon={<ChevronRight />}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            CustomEvents.doc.openDialog.send({ docId: 'codingpack-how-to-system-reset' })
                        }}
                    >
                        가이드
                    </Button> */}
                    </Box>
                    <Typography variant="body1" sx={{ mt: 1, color: '#666', fontSize: '0.9rem' }}>
                        {subtitle}
                    </Typography>
                </Box>
            </Box>
        </ButtonBase>
    )
}
