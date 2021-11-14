# pc-hw

하드웨어 제어를 위한 PC용 프로그램입니다. `electron` 기반으로 구현되었습니다.

## 사전 준비

-   패키지 관리 도구로는 `yarn`을 사용합니다. `npm` 사용해도 되지만, 여기서는 `yarn`을 기준으로 설명합니다.

-   `yarn` 설치는 검색을 통해서 설치하세요. `choco`를 사용중인 윈도우 사용자라면 다음과 같이 설치할 수 있습니다.

```dos
>  choco install yarn
1.22.15
```

## Quick Start

빠르게 실행하는 방법은 다음과 같습니다.

```sh
$  git clone https://github.com/ktaicoder/hw-pc.git
$  cd hw-pc
$  yarn install
$  yarn prebuild
$  yarn dev
```

-   위 명령 중 빌드 또는 실행 단계에서 일부는 안되는 경우도 있습니다. 이 프로젝트는 `USB-TO-SERIAL` 장치를 제어하는 기능이 있는데, 컴퓨터의 USB 장치에 접근하므로 C/C++ 소스코드를 컴파일하는 과정이 필요하며, 컴파일을 위해 필요한 개발용 도구들이 사전에 설치되어 있어야 합니다.

-   C/C++ 소스코드를 컴파일하는 것은 꽤 복잡한 과정이지만, `node-gyp`를 이용해서 비교적 쉽게 컴파일 할 수 있습니다. `node-gyp`를 설치하고, 윈도우라면 컴파일러 도구를 다운로드 받아야 합니다. (맥에서는 아직 안해봤습니다)

### `node-gyp` 설치

-   다음과 같이 `node-gyp`를 설치합니다.

```bash
$  npm install -g node-gyp
```

## 서브 모듈 설명

-   PC용 프로그램은 두 개의 git 서브 모듈을 사용합니다.

    1. `hw-control`: https://github.com/aicoders/hw-control.git
    1. `hw-proto` : https://github.com/aicoders/hw-proto.git

-   예를 들어 설명하는 것이 좋겠습니다. `hw-proto`에서 `LED를 켜라`는 요청을 보내면, `hw-control`은 이 요청을 받아서, 하드웨어에 전달하는 방식으로 동작합니다. 또 `hw-control`은 하드웨어에서 값을 읽어서 응답을 하기도 합니다. 둘 사이의 통신은 웹소켓을 이용하며, `hw-control`은 웹소켓의 서버측에 해당하고, `hw-proto`는 클라이언트에 해당합니다.

### `hw-control` 모듈

-   `hw-control`은 하드웨어를 제어하는 기능이 담긴 라이브러리입니다. 웹소켓 명령을 받아서 하드웨어에 전달합니다. 현재는 `USB-TO-SERIAL`만 지원하며, 블루투스도 곧 지원할 예정입니다.

### `hw-proto` 모듈

-   `hw-proto`는 웹소켓 클라이언트라고 할 수 있는데, 사실은 웹소켓 프로토콜이라고 하는 것이 더 정확합니다. 웹소켓을 통해 제어 명령을 전달하는 기능이 있는 라이브러리이기 때문입니다.

-   이 라이브러리를 이용한 애플리케이션은 NodeJS 기반의 콘솔용 프로그램도 가능하고, 웹페이지도 가능합니다. `mini-demo/src` 폴더에 콘솔용 프로그램의 샘플이 있습니다.
