import { BehaviorSubject } from 'rxjs'
import { BuildVars } from 'src/BuildVars'
import { HcpWebSocketServer } from 'src/hcp/HcpWebSocketServer'
import { IHcpHwManager } from 'src/hcp/hcp-types'

export function createHcpServer(
  clientCount$: BehaviorSubject<number>,
  hcpHwManager: IHcpHwManager,
): HcpWebSocketServer {
  const server = new HcpWebSocketServer(
    { port: BuildVars.hcpWebSocketListenPort },
    clientCount$,
    hcpHwManager,
  )

  return server
}
