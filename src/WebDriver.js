const webdriver = require('selenium-webdriver');
const { checkDir, cleanDir, pruneDir, saveJSONToFile, getFileDate, saveFile } = require('./utils/filesystem')
const { combineImages } = require('./utils/images')
class WebDriver {

    constructor({ name, fileinfo, server, filename, encoding, outdir, debug = false, autoclean, deleteDrafts, deleteOldRuns }) {
        if (filename && fileinfo) throw new Error('Cannot set both filename and fileinfo')

        this.autoclean = autoclean ?? true
        this.deleteDrafts = deleteDrafts ?? false
        this.deleteOldRuns = deleteOldRuns ?? true
        this.name = name || (Math.random() + 1).toString(36).substring(7).toUpperCase()
        this.server = server || 'http://localhost:4444/wd/hub'

        // Files are expected to be saved in the format prefix_YYYMMMDD_Website/name_element_suffix.png
        this.file = filename || fileinfo || { base: getFileDate() }
        this.outdir = outdir || 'output'
        this.draftDir = `${this.outdir}/drafts`
        this.resultsDir = `${this.outdir}/results`

        checkDir(this.draftDir)
        checkDir(this.resultsDir)
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
        if (this.deleteOldRuns) {
            pruneDir(this.resultsDir)
            pruneDir(this.draftDir)
        } else if (this.autoclean) {
            cleanDir(this.draftDir)
            cleanDir(this.resultsDir)
        }


        this.driver = new webdriver.Builder()
            .forBrowser(webdriver.Browser.CHROME)
            .usingServer(this.server)
            .build();

        const { height, width } = await this.driver.manage().window().getSize()
        this.currentScreenSize = { width, height }
    }

    async addComparisonFiles() {

    }

    updateFile(fileinfo) {
        if (fileinfo) this.file = fileinfo
        else if (typeof this.file === 'object') {
            this.file.base = getFileDate()
        }
        if (this.debug) console.log(`updating file, new file info:  ${this.file}`)
    }

    saveFile(data, { filename = "", fileinfo = this.file, includeDate = true, includeScreenSize = true, customTag }) {
        let metadata = {}
        if (filename || typeof fileinfo === 'string') {
            if (!filename) filename = fileinfo
            metadata = { name: this.name }
            if (includeScreenSize) metadata.screenSize = `${this.currentScreenSize.width}x${this.currentScreenSize.height}`
            if (customTag) metadata.customTag += customTag
        } else {
            if (this?.file?.prefix) metadata.prefix = this.file.prefix
            if (this?.file?.base) metadata.base = this.file.base
            metadata.name = this.name
            if (includeScreenSize) metadata.screenSize = `${this.currentScreenSize.width}x${this.currentScreenSize.height}`
            if (customTag) metadata.customTag = customTag
            if (this?.file?.suffix) metadata.suffix = this.file.suffix

            filename = `${this.draftDir}/${Object.values(metadata).join('_')}.png`
        }
        if (this.debug) console.log(`Saving file ${filename}`)
        saveFile(filename, data);
        return { metadata, filename }
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
        let screenshotInfo = null
        await this.driver
            .takeScreenshot()
            .then((image) => {
                screenshotInfo = this.saveFile(image, options)
            })
        return screenshotInfo
    }

    async takeScreenshots({ websites, screens, elements }) {
        this.checkProperties({ websites })

        if (!screens || !screens?.length === 0) screens = [{ width: null, height: null }]
        if (!elements || !elements?.length === 0) elements = [{ type: null, value: 'default' }]

        let savedFiles = {}

        for (let website of websites) {
            await this.driver.get(website.url)
            savedFiles[website.name] = {}
            for (let element of elements) {
                let el = await this.describeElement(element.type, element.value)
                savedFiles[website.name][element.value] = {}
                await this.scrollToElement(el)
                for (let { width, height } of screens) {
                    await this.changeScreenSize({ width, height })
                    let { filename, metadata } = await this.takeScreenshot({ includeScreenSize: true, customTag: `${website.name}_${element.value}` })
                    savedFiles[website.name][element.value][`${width}x${height}`] = { filename, metadata }
                }
            }

        }
        await saveJSONToFile(savedFiles, `${this.outdir}/files.json`)
        this.processedFiles = savedFiles
    }

    async compare() {
        if (!this.processedFiles) return
        if (this.debug) console.log(`comparing generated files:  ${this.file}`)
        let results = []
        let websites = Object.keys(this.processedFiles)
        if (websites.length > 2) throw new Error('Cannot compare more than 2 websites')

        for (let element of Object.keys(this.processedFiles[websites[0]])) {
            for (let size of Object.keys(this.processedFiles[websites[0]][element])) {
                const { filename: filename1, metadata: metadata1 } = this.processedFiles[websites[0]][element][size]
                const { filename: filename2, metadata: metadata2 } = this.processedFiles[websites[1]][element][size]
                let outputfile = this.resultsDir + '/'
                if (metadata1.prefix) outputfile += metadata1.prefix + '_'
                if (metadata1.base) outputfile += metadata1.base + '_'
                if (metadata1.name) outputfile += metadata1.name + '_'
                if (metadata1.screenSize) outputfile += metadata1.screenSize + '_'
                outputfile = outputfile.replace(/_$/, '') + '.png'
                results.push(outputfile)
                await combineImages(filename1, filename2, outputfile)
            }
        }
        if (this.deleteDrafts)
            pruneDir(this.draftDir)
    }

    async close() {
        await this?.driver?.quit()
    }

}

module.exports = WebDriver