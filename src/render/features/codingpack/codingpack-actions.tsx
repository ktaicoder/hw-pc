import React from 'react'
import { CodingpackActionKindKey } from 'src/domain/codingpack'

type CodingpackActionData = {
  kind: CodingpackActionKindKey
  docId: string
  title: React.ReactNode
  subtitle: React.ReactNode
}

export const CodingpackActions: CodingpackActionData[] = [
  {
    kind: 'inspect',
    docId: 'codingpack-how-to-system-reset',
    title: '코디니팩 정보',
    subtitle: (
      <>
        <em>코디니팩의 정보</em>를 조회합니다. <br />
        모델, IP 주소, SD 카드 등을 조회합니다.
      </>
    ),
  },
  {
    kind: 'sdexpand',
    docId: 'codingpack-how-to-expand-sdcard',
    title: 'SD카드 확장',
    subtitle: (
      <>
        <em>코디니팩의 SD카드</em>를 확장합니다. <br />
        이미지를 구운 직후 반드시 실행해야 합니다.
      </>
    ),
  },
  {
    kind: 'upgrade',
    docId: 'codingpack-how-to-system-reset',
    title: '시스템 초기화',
    subtitle: (
      <>
        시스템을 <em>최신 버전</em>으로 업그래이드합니다. <br />
        초기화 후에 자동으로 <b>재부팅</b>합니다
      </>
    ),
  },
  {
    kind: 'update',
    docId: 'codingpack-how-to-system-reset',
    title: '코디니팩 업데이트',
    subtitle: (
      <>
        코디니팩의 <em>작은 SW 수정사항</em>을 적용합니다.
      </>
    ),
  },
  {
    kind: 'audio',
    docId: 'codingpack-how-to-system-reset',
    title: '오디오 테스트',
    subtitle: (
      <>
        코디니팩의 <em>스피커와 마이크</em>를 테스트합니다
      </>
    ),
  },
  {
    kind: 'autorun',
    docId: 'codingpack-how-to-system-reset',
    title: '오토런',
    subtitle: (
      <>
        코디니팩의 <em>버튼을 눌러서 실행할 작품</em>을 등록합니다.
      </>
    ),
  },
  {
    kind: 'wifi',
    docId: 'codingpack-how-to-system-reset',
    title: 'WIFI 설정',
    subtitle: (
      <>
        코디니팩의 <em>WIFI</em>를 설정합니다
      </>
    ),
  },
  {
    kind: 'pw',
    docId: 'codingpack-how-to-system-reset',
    title: '사용자 비밀번호 변경',
    subtitle: (
      <>
        사용자의 `pi`의 <em>비밀번호</em>를 잊은 경우 재설정하세요
      </>
    ),
  },
  {
    kind: 'bluetooth',
    docId: 'codingpack-how-to-system-reset',
    title: '블루투스 이름 설정',
    subtitle: (
      <>
        코디니팩의 <em>블루투스 이름</em>을 설정하세요
      </>
    ),
  },
  {
    kind: 'reboot',
    docId: 'codingpack-how-to-system-reset',
    title: '재부팅',
    subtitle: (
      <>
        코디니팩을 <em>재부팅</em>합니다
      </>
    ),
  },
  {
    kind: 'rescue',
    docId: 'codingpack-how-to-system-reset',
    title: '시스템 복구',
    subtitle: (
      <>
        코디니팩이 정상동작 하지 않는 경우 <em>시스템을 복구</em>합니다. <br />
        복구 후에는 자동으로 재부팅합니다.
      </>
    ),
  },
]
