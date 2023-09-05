import { Portlet, PortletContent, PortletHeader, PortletLabel } from '@cp949/mui-common'
import InfoIcon from '@mui/icons-material/Info'
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { IContext } from 'src/services/context/IContextService'
import { usePromiseValue } from '../hooks/useServiceValue'

export default function FolderInspectView() {
  const context = usePromiseValue<IContext | undefined>(async () => await window.service.context.getAll(), undefined)

  return (
    <Portlet square>
      <PortletHeader>
        <PortletLabel title="폴더 정보" icon={<InfoIcon />} />
      </PortletHeader>
      <PortletContent>
        <TableContainer>
          <Table>
            <TableHead></TableHead>
            <TableBody>
              <RowItem label="애플리케이션 폴더" value={context?.appPath} />

              <RowItem label="애플리케이션 진입점" value={context?.MAIN_WINDOW_WEBPACK_ENTRY} />
              <TableRow>
                <TableCell>로그 폴더</TableCell>
                <TableCell>{context?.LOG_FOLDER}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>설정 폴더</TableCell>
                <TableCell>{context?.SETTINGS_FOLDER}</TableCell>
              </TableRow>
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
