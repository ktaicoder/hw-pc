const { SerialPort } = require('serialport')


async function handleSp(sp) {
    console.log('handle serialport ')
    sp.on('data', (msg) => {
        console.log('on(data): ', msg)
    })

    sp.resume()
    sp.on('readable', () => {
        console.log('on(readable) called')
        sp.read(2)
    })

    sp.on('error', (err) => {
        console.log('error', err)
    })

    sp.write(Buffer.from('1234'), function (err) {
        if (err) {
            return console.log('Error on write: ', err.message)
        }
        console.log('message written')
    })
}

async function main() {
    const sp = new SerialPort({
        path: 'COM13', baudRate: 115200,
        autoOpen: true
    }, (err) => {
        if (err) {
            console.log('sp create fail:', err)
        }
    })
    sp.on('open', () => {
        console.log('open success')
        handleSp(sp)
    })
    // sp.open(err => {
    //     if (err) {
    //         console.warn('open fail', err)
    //         return
    //     }
    //     console.log('open success')
    //     handleSp(sp)
    // })

}


main()
