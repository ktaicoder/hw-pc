import { useCallback, useEffect, useRef, useState } from 'react'
import { useUnmount } from 'react-use'

/**
 * 시간이 지나면 자동으로 사라지는 텍스트
 * @param timeoutMs
 * @returns
 */
export function useTimeoutText(timeoutMs: number): [string | null, (t: string | null) => void] {
    const [text, setText] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [refreshToken, setRefreshToken] = useState(0)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    useUnmount(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    })

    const updateMessage = useCallback((text: string) => {
        setRefreshToken(Date.now())
        setText(text)
    }, [])

    useEffect(() => {
        if (!text) {
            // 타이머를 종료하지 않는다.
            return
        }
        // 새로운 메시지가 오면 타이머를 종료한다
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }

        setMessage(text)
        timerRef.current = setTimeout(() => {
            setMessage(null)
        }, timeoutMs)
        return () => {
            // clearTimeout(timer)
        }
    }, [text, refreshToken, timeoutMs])
    return [message, updateMessage]
}
