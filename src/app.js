
const file_date = new Date().toISOString().replace(/[\-:]/g, '').replace('T', "_").split('.')[0]
const file = `output/${file_date}.png`
const WebDriver = require('./WebDriver')
const config = require('../config.json')

async function main() {
    let driver = new WebDriver('mytest')
    await driver.setup()
    await driver.takeScreenshot({ url: 'http://google.com' })
    await driver.close()
}

main()