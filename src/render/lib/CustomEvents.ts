import { EventTypes } from './common'
import { OpenDocDialogEvent } from './OpenDocDialogEvent'

/**
 * 커스텀 이벤트
 * 사용예시) CustomEvents.login.openDialog.send()
 */
export class CustomEvents {
    static doc = {
        openDialog: OpenDocDialogEvent,
    }

    static Types = EventTypes
}
