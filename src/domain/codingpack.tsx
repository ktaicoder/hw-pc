export type CodingpackActionKindKey = 'upgrade' | 'update' | 'pw' | 'audio' | 'wifi' | 'bluetooth' | 'reboot' | 'rescue'
export const CodingpackActionKind = {
    upgrade: '시스템 초기화',
    update: '코딩팩 업데이트',
    pw: '비밀번호 재설정',
    audio: '오디오 테스트',
    wifi: '와이파이 설정',
    bluetooth: '블루투스 설정',
    reboot: '재부팅',
    rescue: '시스템 복구',
} as Record<CodingpackActionKindKey, string>