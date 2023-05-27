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
            throw new Error(`Missing required property ${error[0]}`)
        }
    }

    async setup() {
        this.driver = new webdriver.Builder()
            .forBrowser(webdriver.Browser.CHROME)
            .usingServer(this.server)
            .build();

        const { height, width } = await this.driver.manage().window().getSize()
        this.currentScreenSize = { width, height }
    }

    updateFile(fileinfo) {
        if (fileinfo) this.file = fileinfo
        else if (typeof this.file === 'object') {
            this.file.base = getFileDate()
        }
        if (this.debug) console.log(`updating file, new file info:  ${this.file}`)
    }

    saveFile(data, { fileinfo = this.file, includeDate = true, includeScreenSize = true, customTag }) {
        let filename = ""
        if (typeof fileinfo === 'string') {
            filename = fileinfo
        } else {
            filename += this.outdir + '/'
            if (this?.file?.prefix) filename += `_${this.file.prefix}_`
            if (this?.file?.base) filename += `_${this.file.base}_`
            filename += this.name
            if (includeScreenSize) filename += `_${this.currentScreenSize.width}x${this.currentScreenSize.height}_`
            if (customTag) filename += `_${customTag}_`
            if (this?.file?.suffix) filename += `_${this.file.suffix}_`
            filename += '.png'
            filename = filename.replace(/_+/g, '_')
        }
        if (this.debug) console.log(`Saving file ${filename}`)
        fs.writeFileSync(filename, data, this.encoding);
        return filename
    }

    async changeScreenSize({ width, height }) {
        if (this.debug) console.log(`changing screen size to ${width}x${height}`)
        this.checkProperties()
        if (!width && !height) return
        if (!width) width = this.currentScreenSize.width
        if (!height) height = this.currentScreenSize.height
        this.currentScreenSize = { width, height }
        await this.driver.manage().window().setRect({ width, height })
    }

    async describeElement(type, element) {
        switch (type) {
            case 'css':
                return this.driver.findElement(webdriver.By.css(element))
            case 'xpath':
                return this.driver.findElement(webdriver.By.xpath(element))
            case 'id':
                return this.driver.findElement(webdriver.By.id(element))
            case 'class':
                return this.driver.findElement(webdriver.By.className(element))
            default:
                return null
        }
    }

    async scrollToElement(element) {
        if (!element) return // nothing to scroll to
        if (this.debug) console.log(`scrolling to element ${element}`)
        this.checkProperties()
        await this.driver.executeScript(`arguments[0].scrollIntoView(true);`, element)
    }

    async takeScreenshot(options) {
        await this.driver
            .takeScreenshot()
            .then((image) => {
                this.saveFile(image, options)
            })
    }

    async takeScreenshots({ url, screens, elements }) {
        this.checkProperties({ url })
        await this.driver.get(url);

        if (!screens || !screens?.length === 0) screens = [{ width: null, height: null }]
        if (!elements || !elements?.length === 0) elements = [{ type: null, value: 'default' }]

        for (let element of elements) {
            let el = await this.describeElement(element.type, element.value)
            await this.scrollToElement(el)
            for (let { width, height } of screens) {
                await this.changeScreenSize({ width, height })
                await this.takeScreenshot({ includeScreenSize: true, customTag: element.value })
            }
        }
    }

    compare(saveProps, ...webdrivers) { }

    async close() {
        await this?.driver?.quit()
    }

}

module.exports = WebDriver