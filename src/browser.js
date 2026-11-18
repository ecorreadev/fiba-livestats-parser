/**
 * Manejo del browser con Puppeteer
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');

const getExecutablePath = async () => {
    // 1. Variable de entorno explícita
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        return process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    if (process.env.CHROME_PATH) {
        return process.env.CHROME_PATH;
    }

    // 2. Si estamos en Windows, buscar Chrome o Edge local
    if (process.platform === 'win32') {
        const windowsPaths = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe` : null,
            'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
            'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
            process.env.PROGRAMFILES ? `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe` : null,
            process.env['PROGRAMFILES(X86)'] ? `${process.env['PROGRAMFILES(X86)']}\\Google\\Chrome\\Application\\chrome.exe` : null
        ];

        for (const p of windowsPaths) {
            if (p && fs.existsSync(p)) {
                return p;
            }
        }
    }

    // 3. Si estamos en macOS
    if (process.platform === 'darwin') {
        const macPaths = [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
        ];
        for (const p of macPaths) {
            if (fs.existsSync(p)) {
                return p;
            }
        }
    }

    // 4. En entornos Lambda / Linux / Producción, usar @sparticuz/chromium
    try {
        const chromium = require('@sparticuz/chromium');
        return await chromium.executablePath();
    } catch (e) {
        throw new Error('No se encontró un ejecutable de navegador (Chrome / Edge / Chromium) en el sistema.');
    }
};

const launchBrowser = async () => {
    const isWindowsOrMac = process.platform === 'win32' || process.platform === 'darwin';
    let chromium;
    try {
        chromium = require('@sparticuz/chromium');
    } catch (e) {}

    const executablePath = await getExecutablePath();

    const args = isWindowsOrMac
        ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        : (chromium ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox']);

    const defaultViewport = chromium ? chromium.defaultViewport : { width: 1280, height: 720 };
    const headless = chromium ? chromium.headless : true;

    return puppeteer.launch({
        args,
        defaultViewport,
        executablePath,
        headless,
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

