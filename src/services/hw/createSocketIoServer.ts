import { Server } from 'socket.io'

export function createSocketIoServer(): Server {
    const io = new Server({
        cors: {
            origin: '*',
            // methods: ["GET", "POST"]
        },
    })

    return io
}
