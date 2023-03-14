import { BehaviorSubject } from 'rxjs'
import { IUiLogger } from 'src/custom-types'
import { HcpHwManager } from 'src/hcp/HcpHwManager'
import { HcpWebSocketServer } from 'src/hcp/HcpWebSocketServer'

export function createHcpServer(
  clientCount$: BehaviorSubject<number>,
  uiLogger: IUiLogger,
  hcpHwManager: HcpHwManager,
): HcpWebSocketServer {
  const server = new HcpWebSocketServer({ port: 13997 }, clientCount$, uiLogger, hcpHwManager)

  return server
}
