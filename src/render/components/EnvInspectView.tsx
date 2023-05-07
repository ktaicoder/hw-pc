import { Portlet, PortletContent, PortletHeader, PortletLabel } from '@cp949/mui-common'
import InfoIcon from '@mui/icons-material/Info'
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { IContext } from 'src/services/context/interface'
import { usePromiseValue } from '../hooks/useServiceValue'

export default function EnvInspectView() {
  const context = usePromiseValue<IContext | undefined>(async () => await window.service.context.getAll(), undefined)

  return (
    <Portlet square>
      <PortletHeader>
        <PortletLabel title="실행 환경 정보" icon={<InfoIcon />} />
      </PortletHeader>
      <PortletContent>
        <TableContainer>
          <Table>
            <TableHead></TableHead>
            <TableBody>
              <TableRow>
                <TableCell>앱이름</TableCell>
                <TableCell>
                  {context?.appName}
                  {context?.platform ? `-${context?.platform}` : ''}
                  {context?.appVersion ? `-v${context?.appVersion}` : ''}
                </TableCell>
              </TableRow>
              <RowItem label="패키징" value={context?.appIsPackaged} />
              <TableRow>
                <TableCell>디버그</TableCell>
                <TableCell>{context?.isDevelopment === true ? 'Yes' : 'No'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>운영체제</TableCell>
                <TableCell>
                  {context?.osName} ({context?.osVersion}, {context?.osArch})
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>플랫폼</TableCell>
                <TableCell>{context?.platform}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>NodeJS</TableCell>
                <TableCell>{context?.environmentVersions?.['node']}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Electron</TableCell>
                <TableCell>{context?.environmentVersions?.['electron']}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Chrome</TableCell>
                <TableCell>{context?.environmentVersions?.['chrome']}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>V8</TableCell>
                <TableCell>{context?.environmentVersions?.['v8']}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>프로세스 리소스</TableCell>
                <TableCell>{context?.processResourcePath}</TableCell>
              </TableRow>
              <RowItem label="locale" value={context?.locale ?? '-'} />
            </TableBody>
          </Table>
        </TableContainer>
      </PortletContent>
    </Portlet>
  )
}

function RowItem(props: { label: string; value: any }) {
  const { label, value } = props
  return (
    <TableRow>
      <TableCell>{label}</TableCell>
      <TableCell>{typeof value === 'boolean' ? yesOrNo(value) : value}</TableCell>
    </TableRow>
  )
}

function yesOrNo(v: boolean) {
  return v ? 'Yes' : 'No'
}
