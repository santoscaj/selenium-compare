
const WebDriver = require('./WebDriver')
const config = require('../config.json')

async function main() {
    let driver = new WebDriver({ name: 'test', debug: true })
    const screens = config.comparisons[0].screens.slice(0, 3)
    const elements = config.comparisons[0].elements
    const websites = config.websites

    await driver.setup()
    await driver.takeScreenshots({ websites, screens, elements })
    await driver.compare()
    await driver.close()
}

main()