const HwServer = require('../src/services/hw/HwServer').HwServer
const s = new HwServer({ listenPort: 3000 })
s.start()
