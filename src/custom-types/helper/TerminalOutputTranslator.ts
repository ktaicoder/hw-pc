import { Transform } from 'stream'
type TransformCallback = (error?: Error | null, data?: any) => void

/**
 * Convert carriage returns to newlines for output
 */
export class TerminalOutputTranslator extends Transform {
    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        for (let index = 0; index < chunk.length; index++) {
            const byte = chunk[index]
            if (byte === 0x0d) {
                // chunk[index] = 0x0a
            }
        }
        //console.log('chunk', chunk)
        // process.stderr.write(chunk)
        this.push(chunk)
        callback()
    }
}
