import { Alert, ButtonBase, Typography } from '@mui/material'
import { BuildVars } from 'src/BuildVars'
import Image from 'src/render/components/Image'

export default function ConnectedMessageView() {
  const handleClickChrome = () => {
    window.service.native.openUrl(BuildVars.blockcodingUrl)
  }

  return (
    <Alert
      severity="info"
      sx={{
        display: 'flex',
        mt: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#EBF2F8',
        margin: '0 auto',
        '& ul li': {
          lineHeight: '1.2rem',
        },
      }}
      icon={false}
    >
      <ul>
        <li>장치에 연결되었습니다. </li>
        <li>이제 블록코딩으로 장치를 제어할 수 있습니다.</li>
      </ul>
      <ButtonBase
        component="div"
        onClick={handleClickChrome}
        sx={{
          ml: 4,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 1,
          border: '1px solid #01415E',
          borderRadius: 1,
        }}
      >
        <Image sx={{ width: 20, height: 20, mr: 1 }} src="/static/images/ic_chrome.png" />
        <Typography variant="body1" sx={{ fontSize: '0.9rem', color: '#01415E' }}>
          블록코딩 실행
        </Typography>
      </ButtonBase>
      <ul>
        <li>OS의 디폴트 브라우저가 크롬인 경우, 클릭시 크롬브라우저가 실행됩니다.</li>
        <li>크롬 브라우저 사용을 권장합니다. </li>
        <li>직접 크롬 브라우저를 실행 후 AI Codiny 사이트에 접속하셔도 됩니다.</li>
      </ul>
    </Alert>
  )
}
