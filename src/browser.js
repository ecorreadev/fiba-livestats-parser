/**
 * Manejo del browser con Puppeteer
 */

const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const launchBrowser = async () => {
    return puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
    });
};

const setupUserAgent = (page) => {
    return page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    );
};

module.exports = {
    launchBrowser,
    setupUserAgent
};
