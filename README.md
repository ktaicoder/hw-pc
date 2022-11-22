# AI Codiny PC 프로그램

AI Codiny에서 하드웨어 제어를 위한 PC용 프로그램입니다. `electron` 기반으로 구현되었습니다.

## 사전 준비

- `yarn`을 기준으로 설명합니다.(`npm` 사용해도 됩니다)

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

