const webdriver = require('selenium-webdriver');
const fs = require('fs')
const file_date = new Date().toISOString().replace(/[\-:]/g, '').replace('T', "_").split('.')[0]
const file = `output/${file_date}.png`
const encoding_system = 'base64'

async function takeScrenshot() {

    let driver = new webdriver.Builder()
        .forBrowser(webdriver.Browser.CHROME)
        .usingServer('http://localhost:4444/wd/hub')
        .build();

    await driver.get('https://selenium.dev');

    driver.takeScreenshot()
        .then((image) => {
            fs.writeFileSync(file, image, encoding_system);
        });

    await driver.quit();
}

takeScrenshot()