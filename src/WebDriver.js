const webdriver = require('selenium-webdriver');
const fs = require('fs')

const getFileDate = () => new Date().toISOString().replace(/[\-:]/g, '').replace('T', "_").split('.')[0]
class WebDriver {

    constructor({ name, fileinfo, server, filename, encoding, outdir, debug = false }) {
        if (filename && fileinfo) throw new Error('Cannot set both filename and fileinfo')

        this.name = name || (Math.random() + 1).toString(36).substring(7).toUpperCase()
        this.encoding = encoding || 'base64'
        this.server = server || 'http://localhost:4444/wd/hub'

        // Files are expected to be saved in the format prefix_YYYMMMDD_Website/name_element_suffix.png
        this.file = filename || fileinfo || { base: getFileDate() }
        this.outdir = outdir || 'output'
        this.debug = debug
    }

    checkProperties(propsToCheck) {
        if (!this.driver) throw new Error('Driver has not been set up')
        if (!propsToCheck) return
        let error = Object.entries(propsToCheck).find((entry) => !entry[1])
        if (error) {
            console.log(propsToCheck)
            throw new Error(`Missing required property ${error[0]}`)
        }
    }

    async setup() {
        this.driver = new webdriver.Builder()
            .forBrowser(webdriver.Browser.CHROME)
            .usingServer(this.server)
            .build();
    }

    updateFile(fileinfo) {
        if (fileinfo) this.file = fileinfo
        else if (typeof this.file === 'object') {
            this.file.base = getFileDate()
        }
        if (this.debug) console.log(`updating file, new file info:  ${this.file}`)
    }

    saveFile(data, fileinfo = this.file) {
        let filename = ""
        if (typeof fileinfo === 'string') {
            filename = fileinfo
        } else {
            filename += this.outdir + '/'
            if (this?.file?.prefix) filename += this.file.prefix + '_'
            if (this?.file?.base) filename += this.file.base + '_'
            filename += this.name
            if (this?.file?.suffix) filename += this.file.suffix + '_'
            filename += '.png'
        }
        if (this.debug) console.log(`Saving file ${filename}`)
        fs.writeFileSync(filename, data, this.encoding);
        return filename
    }

    async changeScreenSize({ width, height }) {
        if (this.debug) console.log(`changing screen size to ${width}x${height}`)
        this.checkProperties()
        if (!width && !height) return
        if (!width) width = await this.driver.manage().window().getSize().width
        if (!height) height = await this.driver.manage().window().getSize().height
        await this.driver.manage().window().setRect({ width, height })
    }

    async takeScreenshot() {
        await this.driver
            .takeScreenshot()
            .then((image) => {
                this.saveFile(image)
            })
    }

    async takeScreenshots({ url, screens, elements }) {
        if (this.debug) console.log(`screenshot for url ${url}, details: `, { screens, elements })
        this.checkProperties({ url })
        await this.driver.get(url);

        if (!screens || !screens?.length === 0) screens = [{ width: null, height: null }]

        for (let { width, height } of screens) {
            await this.changeScreenSize({ width, height })
            await this.takeScreenshot()
        }
    }

    compare(saveProps, ...webdrivers) { }

    async close() {
        await this?.driver?.quit()
    }

}

module.exports = WebDriver