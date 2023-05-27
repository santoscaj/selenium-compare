
const file_date = new Date().toISOString().replace(/[\-:]/g, '').replace('T', "_").split('.')[0]
const file = `output/${file_date}.png`
const WebDriver = require('./WebDriver')
const config = require('../config.json')

async function main() {
    let driver = new WebDriver({ name: 'test', debug: true })
    await driver.setup()
    await driver.takeScreenshots({ url: config.websites[0].url, screens: config.comparisons[0].screens, elements: config.comparisons[0].elements })
    await driver.close()
}

main()