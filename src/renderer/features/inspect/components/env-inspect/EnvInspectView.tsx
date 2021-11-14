import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { usePromiseValue } from 'src/renderer/util/useServiceValue'
import { IContext } from 'src/services/context/interface'
import { usePreference } from 'src/services/preferences/hooks'
import Portlet from 'src/renderer/components/Portlet'
import PortletContent from 'src/renderer/components/PortletContent'
import PortletHeader from 'src/renderer/components/PortletHeader'
import PortletLabel from 'src/renderer/components/PortletLabel'
import InfoIcon from '@mui/icons-material/Info'
export default function EnvInspectView() {
    const preference = usePreference()
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
                                <TableCell>바탕화면 위치</TableCell>
                                <TableCell>{context?.DESKTOP_PATH}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>로그 폴더</TableCell>
                                <TableCell>{context?.LOG_FOLDER}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>설정 폴더</TableCell>
                                <TableCell>{context?.SETTINGS_FOLDER}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>애플리케이션 진입점</TableCell>
                                <TableCell>{context?.MAIN_WINDOW_WEBPACK_ENTRY}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </PortletContent>
        </Portlet>
    )
}
