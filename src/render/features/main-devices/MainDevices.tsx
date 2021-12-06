import RefreshIcon from '@mui/icons-material/Refresh'
import { Box, Grid, IconButton } from '@mui/material'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { useCallback, useContext, useEffect, useState } from 'react'
import { useMeasure } from 'react-use'
import { IHwInfo } from 'src/custom-types/hw-types'
import Image from 'src/render/components/Image'
import MainLayoutContext from 'src/render/layout/main/MainLayoutContext'
import DeviceGridItem from './components/device-grid-item/DeviceGridItem'
import { useHwInfoList } from './useHwInfoList'
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip'
import { styled } from '@mui/material/styles'

const LightTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: theme.palette.common.white,
        color: 'rgba(0, 0, 0, 0.87)',
        boxShadow: theme.shadows[1],
        fontSize: 11,
    },
}))

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
    '& .MuiToggleButtonGroup-grouped': {
        // margin: theme.spacing(0.5, 1),
        // border: 0,
        // '&.Mui-disabled': {
        //     border: 0,
        // },
        '&.MuiToggleButton-root': {
            paddingTop: 1,
            paddingBottom: 1,
            paddingLeft: theme.spacing(2),
            paddingRight: theme.spacing(2),
            whiteSpace: 'nowrap',
            [theme.breakpoints.down('sm')]: {
                paddingLeft: theme.spacing(1),
                paddingRight: theme.spacing(1),
            },
        },
        '&.MuiToggleButton-root.Mui-selected': {
            color: theme.palette.primary.main,
            borderColor: theme.palette.primary.main,
        },
        '&:not(:first-of-type)': {
            borderRadius: 0, //theme.shape.borderRadius,
        },
        '&:first-of-type': {
            borderRadius: 0, //theme.shape.borderRadius,
        },
    },
}))
{
    /* <ToggleButton value="all" aria-label="all">
전체
</ToggleButton>
<ToggleButton value="robot" aria-label="robot">
로봇형
</ToggleButton>
<ToggleButton value="module" aria-label="module">
모듈형
</ToggleButton>
<ToggleButton value="board" aria-label="board"> */
}
type SearchOption = {
    category: 'all' | 'robot' | 'module' | 'board'
}
const DEFAULT_SEARCH_OPTION: SearchOption = {
    category: 'all',
}

const getHwName = (info: IHwInfo): string => {
    if (typeof info.hwName === 'string') {
        return info.hwName
    }
    return Object.values(info.hwName)[0]
}

export default function MainDevices() {
    const [contentDivRef, { width: contentWidth }] = useMeasure<HTMLDivElement>()
    const [allDeviceList, favorHwIds, refresh, toggleFavor] = useHwInfoList({ withTerminal: false })
    const [option, setOption] = useState<SearchOption>(DEFAULT_SEARCH_OPTION)
    const { hwKind, searchQuery } = useContext(MainLayoutContext)!
    const [deviceList, setDeviceList] = useState<IHwInfo[]>([])

    const _onChangeDeviceType = (event: React.MouseEvent<HTMLElement>, deviceType: string) => {
        const newValue = deviceType as SearchOption['category']
        setOption((p) => ({ ...p, category: newValue }))
    }

    const _onClickFavor = (hwId: string) => {
        toggleFavor(hwId)
    }

    const filterDeviceList = useCallback(
        async (
            searchQuery: string | undefined,
            category: SearchOption['category'],
            hwKind: 'all' | 'serial' | 'bluetooth',
            allDeviceList: IHwInfo[],
        ) => {
            if (!searchQuery && category === 'all' && hwKind === 'all') {
                setDeviceList(allDeviceList)
                return
            }
            const query = searchQuery?.toLocaleLowerCase() ?? ''

            setDeviceList(
                allDeviceList
                    .filter((it) => hwKind === 'all' || it.hwKind === hwKind)
                    .filter((it) => category === 'all' || it.category === category)
                    .filter((it) => {
                        if (query.length === 0) return true
                        const hwName = getHwName(it)
                        return hwName.toLocaleLowerCase().includes(query)
                    }),
            )
        },
        [],
    )

    useEffect(() => {
        filterDeviceList(searchQuery, option.category, hwKind, allDeviceList)
    }, [searchQuery, option, hwKind, allDeviceList, filterDeviceList])

    const updateHwSelection = useCallback(async (info: IHwInfo) => {
        const hwId = info.hwId
        const isSupport = await window.service.hw.isSupportHw(hwId)
        if (!isSupport) {
            alert('지원안함' + info.hwName)
            return
        }
        window.service.hw.selectHw(hwId)
    }, [])

    const _onClickHw = (info: IHwInfo) => {
        updateHwSelection(info)
    }

    return (
        <Box
            sx={{
                position: 'relative',
                flexGrow: 1,
                px: 2,
                display: 'flex',
                border: '0px solid red',
                flexDirection: 'column',
            }}
        >
            <Box
                sx={{
                    position: 'fixed',
                    zIndex: (theme) => theme.zIndex.appBar,
                    width: contentWidth,
                }}
            >
                <Box
                    sx={{
                        px: 0,
                        py: 0,
                        width: '100%',
                        display: 'flex',
                        minHeight: 48,
                        flexWrap: 'nowrap',
                        position: 'relative',
                    }}
                >
                    {/* <Tooltip title="그리드 스타일">
                        <IconButton sx={{ width: 48, height: 48 }}>
                            <AppsIcon fontSize="small" />
                        </IconButton>
                    </Tooltip> */}

                    <Box
                        sx={{
                            display: 'inline-flex',
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            background: (theme) => theme.palette.background.paper,
                            transform: 'translate(-50%, -50%)',
                            border: (theme) => `0px solid ${theme.palette.divider}`,
                            flexWrap: 'nowrap',
                        }}
                    >
                        <StyledToggleButtonGroup
                            size="small"
                            value={option.category}
                            color="primary"
                            onChange={_onChangeDeviceType}
                            exclusive
                            aria-label="hardware type"
                        >
                            <ToggleButton value="all" aria-label="all">
                                전체
                            </ToggleButton>
                            <ToggleButton value="robot" aria-label="robot">
                                로봇형
                            </ToggleButton>
                            <ToggleButton value="module" aria-label="module">
                                모듈형
                            </ToggleButton>
                            <ToggleButton value="board" aria-label="board">
                                보드형
                            </ToggleButton>
                        </StyledToggleButtonGroup>
                    </Box>
                    <Tooltip title="새로고침">
                        <IconButton
                            sx={{ width: 48, height: 48, position: 'absolute', top: 0, right: 0 }}
                            onClick={() => refresh()}
                        >
                            <RefreshIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
            <Box sx={{ flexGrow: 1, py: 1, mt: 9, position: 'relative' }} ref={contentDivRef}>
                <Grid container rowSpacing={2} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
                    {deviceList.map((device, i) => (
                        <Grid item lg={3} md={4} sm={6} xs={12} key={device.hwId}>
                            <DeviceGridItem
                                info={device}
                                star={favorHwIds.has(device.hwId)}
                                onClick={_onClickHw}
                                onClickFavor={_onClickFavor}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Box>
            <Box
                sx={{
                    position: 'absolute',
                    background: 'rgba(0,0,0, 0.05)',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    py: 0.5,
                    pl: 1,
                    pr: '120px',
                }}
            >
                <Box sx={{ color: 'error.main', fontSize: '0.75rem' }}>
                    ★ 하드웨어 작동시 발생하는 문제는 해당 업체에 문의해주세요.
                    <Box sx={{ color: 'text.primary', fontSize: '0.70rem' }}>
                        ★ 등록된 하드웨어는 각 업체가 개발한 것이며, AI 코딩블록은 본 프로그램 외에는 책임지지 않습니다.
                    </Box>
                </Box>
            </Box>

            <LightTooltip title="안녕~">
                <Box
                    sx={{
                        position: 'absolute',
                        width: 80,
                        height: 80,
                        bottom: 16,
                        right: 32,
                    }}
                >
                    <Image
                        sx={{
                            width: '100%',
                            height: '100%',
                        }}
                        src="static/images/robot_167.svg"
                    />
                </Box>
            </LightTooltip>
        </Box>
    )
}
