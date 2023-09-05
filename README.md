# AI Codiny PC 프로그램

AI Codiny에서 하드웨어 제어를 위한 PC용 프로그램입니다. `electron` 기반으로 구현되었습니다.

## 2023년 9월 

- 코디니팩 등의 불필요한 코드 제거
- 이전의 main 브랜치는 old_main 브랜치로 이동
- main 브랜치가 새로운 main 브랜치로 교체되었습니다. 소스코드를 다시 받아주세요.

## 2023년 3월 새로운 환경

### 통신 프로토콜의 변경(HCP)
- 그 동안 블록코딩과 PC 프로그램의 통신 방식은 `socket.io`를 사용해왔습니다. 하지만 안드로이드를 포함하여 다양한 하드웨어 및 프로그래밍 언어를 지원하기에는 `socket.io`는 부족하여, `raw websocket`위에 코디니 자체적으로 설계한 통신 프로토콜(HCP)을 사용하도록 변경했습니다.

### 변경사항 요약

변경사항을 요약하면 다음과 같습니다.

|                 | 기존           | 2023년 3월부터 |
| --------------- | -------------- | -------------- |
| 통신            | socket.io      | websocket      |
| electron        | 15.x           | 23.x           |
| electron-forge  | 6.0.0-beta.64  | 6.0.5          |
| node            | 16.x 이상      | 18.x 이상      |
| React           | 17             | 18             |
| serialport      | 9.x            | 10.x           |


## Technical stacks

- 패키지 매니저 yarn classic
- react 18
- electron 23.x
- electron-forge 6.x
- serialport 10.x
- nobx 6.x
- rxjs 7.x
- xterm 5.x
- socket.io 4.6
- mui 5.x
- webosocket 8.x



## Quick Start

빠르게 실행하는 방법은 다음과 같습니다.

```sh
$  git clone https://github.com/ktaicoder/hw-pc.git
$  cd hw-pc
$  yarn install
$  yarn dev
```


## 커스텀 하드웨어 작성

-  모든 하드웨어에는 `하드웨어 ID(hwId)`를 부여합니다.
-  `src/custom/hw` 폴더에 `hwId` 폴더를 만드세요. 
- hwId는 원하는 것으로 결정하면 되고, 
- 만약 hwId가 `awesome`인 하드웨어를 추가한다면 src/custom/hw/`awesome` 폴더를 만들면 됩니다.

### `hwId` 규칙
- `hwId`는 소문자로 시작해야 하고, 공백이 없습니다.
- `camel case` 표기법을 권장합니다.

### 작성할 내용

- `hwId`가 `awesome`인 하드웨어를 예로 든다면,

- 구현할 내용은  `IAwesomeControl.ts` , `AwesomeControl.ts`과 `index.ts` 파일입니다.
    - `IAwesomeControl.ts` 은 하드웨어 인터페이스에 대한 내용이고
    - `AwesomeControl.ts` 은 하드웨어 인터페이스의 구현체입니다. 실제로 하드웨어와 통신하는 코드가 포함됩니다.
    - `index.ts`는 기타 부가적인 정보와 함께 인터페이스와 구현체를 `export`합니다.

### 개발자 가이드
- 더 자세한 내용 `AI Codiny 개발자 가이드` 사이트를 참고해주세요.
    - https://ktaicoder.github.io
