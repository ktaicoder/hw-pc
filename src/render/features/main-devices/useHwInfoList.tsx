import { useCallback, useEffect, useRef, useState } from 'react'
import { IHwInfo, HwKind } from 'src/custom-types'
import { usePreference } from 'src/services/preferences/hooks'

type RefreshFn = () => void
type ToggleFavorFn = (hwId: string, isFavor?: boolean) => void

export function useHwInfoList(params: { withTerminal: boolean }): [IHwInfo[], Set<string>, RefreshFn, ToggleFavorFn] {
    const { withTerminal } = params
    const { favorHwIdList = [] } = usePreference() ?? {}
    const favorHwIdsRef = useRef(new Set<string>())
    const [originalHwMetaList, setOriginalHwMetaList] = useState<IHwInfo[]>([])
    const [infoList, setInfoList] = useState<IHwInfo[]>([])
    const [refreshToken, setRefreshToken] = useState(0)

    const toggleFavorFn = useRef((hwId: string, isFavor?: boolean) => {
        const prev = favorHwIdsRef.current
        if (typeof isFavor === 'undefined') {
            if (prev.has(hwId)) {
                window.service.preferences.set(
                    'favorHwIdList',
                    Array.from(prev).filter((it) => it !== hwId),
                )
            } else {
                window.service.preferences.set('favorHwIdList', Array.from(prev).concat([hwId]))
            }
        } else {
            if (isFavor) {
                if (!prev.has(hwId)) {
                    window.service.preferences.set('favorHwIdList', Array.from(prev).concat([hwId]))
                } else {
                    // already favor
                }
            } else {
                if (prev.has(hwId)) {
                    window.service.preferences.set(
                        'favorHwIdList',
                        Array.from(prev).filter((it) => it !== hwId),
                    )
                } else {
                    // already notFavor
                }
            }
        }
    })

    const loadOriginalHwMetaList = useCallback(async () => {
        try {
            const metaList = await window.service.hw.infoList()
            console.log('metaList = ', { metaList })
            if (withTerminal) {
                setOriginalHwMetaList(metaList)
            } else {
                setOriginalHwMetaList(metaList.filter((it) => it.hwKind !== HwKind.terminal))
            }
        } catch (err) {
            console.warn(err)
        }
    }, [withTerminal])

    const sort = useCallback(async (infos: IHwInfo[], favorHwIds: Set<string>) => {
        const favorInfos: IHwInfo[] = []
        const list: IHwInfo[] = []
        for (const info of infos) {
            if (favorHwIds.has(info.hwId)) {
                favorInfos.push(info)
            } else {
                list.push(info)
            }
        }

        if (favorInfos.length > 0) {
            setInfoList(favorInfos.concat(list))
        } else {
            setInfoList(list)
        }
    }, [])

    const refresh = useCallback(() => setRefreshToken(Date.now()), [])

    useEffect(() => {
        loadOriginalHwMetaList()
    }, [loadOriginalHwMetaList])

    useEffect(() => {
        favorHwIdsRef.current = new Set(favorHwIdList)
        refresh()
    }, [favorHwIdList, refresh])

    useEffect(() => {
        if (originalHwMetaList.length > 0) {
            sort(originalHwMetaList, favorHwIdsRef.current)
        }
    }, [refreshToken, originalHwMetaList.length > 0, sort])

    return [infoList, favorHwIdsRef.current, refresh, toggleFavorFn.current]
}
