import { MdOrUp, SmOrUp } from '@cp949/mui-common'
import { Box } from '@mui/material'
import Image from 'src/render/components/Image'
import LightTooltip from './LightTooltip'

export default function NoticeView() {
  return (
    <>
      <SmOrUp>
        <Box
          sx={{
            position: 'absolute',
            background: 'rgba(0,0,0, 0.03)',
            bottom: 0,
            left: 0,
            right: 0,
            py: 0.5,
            pl: 1,
            pr: '120px',
          }}
        >
          <Box sx={{ color: '#FF7300', fontSize: '0.75rem' }}>
            ★ 하드웨어 작동시 발생하는 문제는 해당 업체에 문의해주세요.
            <Box sx={{ color: '#666', fontSize: '0.70rem' }}>
              ★ 등록된 하드웨어는 각 업체가 개발한 것이며, AI Codiny는 본 프로그램 외에는 책임지지 않습니다.
            </Box>
          </Box>
        </Box>
      </SmOrUp>
      <MdOrUp>
        <LightTooltip title="안녕~">
          <Box
            sx={{
              position: 'absolute',
              width: 80,
              height: 80,
              bottom: 35,
              right: 215,
            }}
          >
            <Image
              sx={{
                width: '288px',
                height: '105px',
              }}
              src="static/images/robot_167.svg"
            />
          </Box>
        </LightTooltip>
      </MdOrUp>
    </>
  )
}
