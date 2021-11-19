# AI 코딩블록 PC 프로그램

AI 코딩블록에서 하드웨어 제어를 위한 PC용 프로그램입니다. `electron` 기반으로 구현되었습니다.

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

-   위 명령 중 빌드 또는 실행 단계에서 일부는 안되는 경우도 있습니다. 이 프로젝트는 `USB-TO-SERIAL` 장치를 제어하는 기능이 있는데, 컴퓨터의 USB 장치에 접근하므로 C/C++ 소스코드를 컴파일하는 과정이 필요하며, 컴파일을 위해 필요한 개발용 도구들이 사전에 설치되어 있어야 합니다.

-   C/C++ 소스코드를 컴파일하는 것은 꽤 복잡한 과정이지만, `node-gyp`를 이용해서 비교적 쉽게 컴파일 할 수 있습니다. `node-gyp`를 설치하고, 윈도우라면 컴파일러 도구를 다운로드 받아야 합니다. (맥에서는 아직 안해봤습니다)

### `node-gyp` 설치

-   다음과 같이 `node-gyp`를 설치합니다.

```bash
$  npm install -g node-gyp
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
- 더 자세한 내용 `AI 코딩블록 개발자 가이드` 사이트를 참고해주세요.
    - https://ktaicoder.github.io

