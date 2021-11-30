export const EventTypes = {
    doc: {
        openDialog: 'doc.openDialog',
    },
}

export const dispatch = (eventName: string, eventDetail?: any) => {
    const detail = eventDetail ? { detail: eventDetail } : undefined
    window.dispatchEvent(new CustomEvent(eventName, detail))
}
