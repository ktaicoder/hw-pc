// import 'module-alias/register'

import { app } from 'electron'
import unhandled from 'electron-unhandled'
import { debugInfo, openNewGitHubIssue } from 'electron-util'
import { isTest } from 'src/constants/environment'
import { logger } from 'src/services/libs/log'

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS '] = 'true'

app.commandLine.appendSwitch('enable-web-bluetooth', 'true')

function runMain() {
  const gotTheLock = app.requestSingleInstanceLock()
  if (!gotTheLock) {
    logger.info('Quitting due to we only allow one instance to run.')
    app.quit()
    return
  }

  if (require('electron-squirrel-startup')) {
    app.quit()
    return
  }

  return import('./bootstrapMainProcess')
}

runMain()

if (!isTest) {
  unhandled({
    showDialog: true,
    logger: logger.error.bind(logger),
    reportButton: (error) => {
      openNewGitHubIssue({
        user: 'ktaicoder',
        repo: 'hw-pc',
        template: 'bug.md',
        title: `bug: ${(error.message ?? '').substring(0, 100)}`,
        body: `## Environment

  ${debugInfo()}

  ## Description:

  <!-- Describe how the bug manifests and what the behavior would be without the bug. -->

  ## Steps to Reproduce:

  <!--  Please explain the steps required to duplicate the issue, especially if you are able to provide a sample or a screen recording.  -->

  ## Additional Context

  \`\`\`typescript\n${error.stack ?? 'No error.stack'}\n\`\`\`

  ---

  <!-- List any other information that is relevant to your issue. Stack traces, related issues, suggestions on how to add, use case, forum links, screenshots, OS if applicable, etc.  -->

  `,
      })
    },
  })
}
