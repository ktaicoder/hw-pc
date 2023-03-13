import { Alert } from '@mui/material'

interface Props {
  portCount: number
}

export default function NotConnectedMessageView(props: Props) {
  const { portCount } = props

  return (
    <Alert
      severity="warning"
      sx={{
        display: 'flex',
        mt: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      icon={false}
    >
      <ul>
        {portCount === 0 && <li>장치를 연결해주세요.</li>}

        <li>장치를 연결했는데 연결포트가 보이지 않는 경우 드라이버를 설치해주세요.</li>
      </ul>
    </Alert>
  )
}
