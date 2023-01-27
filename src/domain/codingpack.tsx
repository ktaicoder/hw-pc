export type CodingpackActionKindKey =
  | 'inspect'
  | 'sdexpand'
  | 'upgrade'
  | 'update'
  | 'audio'
  | 'autorun'
  | 'pw'
  | 'wifi'
  | 'bluetooth'
  | 'reboot'
  | 'rescue'
export const CodingpackActionKind = {
  inspect: '코디니팩 정보',
  sdexpand: 'SD 카드 확장',
  upgrade: '시스템 초기화',
  update: '코디니팩 업데이트',
  audio: '오디오 테스트',
  autorun: '오토런',
  pw: '비밀번호 재설정',
  wifi: '와이파이 설정',
  bluetooth: '블루투스 설정',
  reboot: '재부팅',
  rescue: '시스템 복구',
} as Record<CodingpackActionKindKey, string>
