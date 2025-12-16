/**
 * Screenshot-Only E2B Template
 * 
 * Lightweight template specifically for screenshot capture.
 * Does NOT include Next.js or heavy dependencies - just Chrome + Node.js for fast spawning.
 * 
 * Purpose:
 * - Spawn on-demand when screenshot is needed
 * - Capture screenshot of provided URL
 * - Return PNG buffer
 * - Kill sandbox immediately after
 * 
 * Benefits:
 * - Fast spawn time (~500ms)
 * - No bloat in main Next.js templates
 * - Pay only when capturing screenshots
 * - Separate concerns
 */

import { Template } from "e2b";

/**
 * Build the screenshot-only E2B template
 */
export function buildScreenshotTemplate() {
    return Template()
        // Start with minimal Node.js image
        .fromNodeImage("24-slim")

        // Install Chrome + dependencies
        .aptInstall([
            "chromium",           // Lightweight Chromium browser
            "chromium-driver",    // WebDriver for Chromium
            "fonts-liberation",   // Required fonts
            "libnss3",            // Network Security Services
            "libatk-bridge2.0-0", // Accessibility toolkit
            "libx11-xcb1",        // X11 XCB library
            "libxcomposite1",     // X11 Composite extension
            "libxdamage1",        // X11 Damage extension
            "libxrandr2",         // X11 RandR extension
            "libgbm1",            // Generic Buffer Management
            "libasound2",         // ALSA sound library
        ])

        // Install puppeteer globally (faster than local install)
        .npmInstall("puppeteer", { g: true })

        // Create screenshot capture script using echo (avoid heredoc issues)
        .runCmd("mkdir -p /home/user/screenshot-service")
        .runCmd("cd /home/user/screenshot-service && npm init -y")
        .runCmd("cd /home/user/screenshot-service && npm install puppeteer")

        // Create capture.js using multiple echo commands
        .runCmd("echo \"const puppeteer = require('puppeteer');\" > /home/user/screenshot-service/capture.js")
        .runCmd("echo \"\" >> /home/user/screenshot-service/capture.js")
        .runCmd("echo \"async function captureScreenshot(url) {\" >> /home/user/screenshot-service/capture.js")
        .runCmd("echo \"  console.log('📸 Capturing screenshot of:', url);\" >> /home/user/screenshot-service/capture.js")
        .runCmd("echo \"  const browser = await puppeteer.launch({\" >> /home/user/screenshot-service/capture.js")
        .runCmd("echo \"    headless: true,\" >> /home/user/screenshot-service/capture.js")
        .runCmd("echo \"    executablePath: '/usr/bin/chromium',\" >> /home/user/screenshot-service/capture.js")
        .runCmd("echo \"    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],\" >> /home/user/screenshot-service/capture.js")
        .runCmd("echo \"  });\" >> /home/user/screenshot-service/capture.js")
        .runCmd("echo \"  const page = await browser.newPage();\" >> /home/user/screenshot-service/capture.js")
        .runCmd("echo \"  await page.setViewport({ width: 1920, height: 1080 });\" >> /home/user/screenshot-service/capture.js")
        .runCmd("echo \"  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });\" >> /home/user/screenshot-service/capture.js")
        .runCmd("echo \"  await new Promise(resolve => setTimeout(resolve, 2000));\" >> /home/user/screenshot-service/capture.js")
        .runCmd("echo \"  const screenshot = await page.screenshot({ type: 'png', fullPage: false });\" >> /home/user/screenshot-service/capture.js")
        .runCmd("echo \"  await browser.close();\" >> /home/user/screenshot-service/capture.js")
        .runCmd("echo \"  console.log('✅ Screenshot captured');\" >> /home/user/screenshot-service/capture.js")
        .runCmd("echo \"  return screenshot.toString('base64');\" >> /home/user/screenshot-service/capture.js")
        .runCmd("echo \"}\" >> /home/user/screenshot-service/capture.js")
        .runCmd("echo \"\" >> /home/user/screenshot-service/capture.js")
        .runCmd("echo \"const url = process.argv[2];\" >> /home/user/screenshot-service/capture.js")
        .runCmd("echo \"if (!url) { console.error('❌ Usage: node capture.js <url>'); process.exit(1); }\" >> /home/user/screenshot-service/capture.js")
        .runCmd("echo \"captureScreenshot(url)\" >> /home/user/screenshot-service/capture.js")
        .runCmd("echo \"  .then(base64 => { console.log('SCREENSHOT_START'); console.log(base64); console.log('SCREENSHOT_END'); })\" >> /home/user/screenshot-service/capture.js")
        .runCmd("echo \"  .catch(error => { console.error('❌ Screenshot failed:', error); process.exit(1); });\" >> /home/user/screenshot-service/capture.js")

        .runCmd("chmod +x /home/user/screenshot-service/capture.js")
        .runCmd("echo '✅ Screenshot service ready' > /home/user/screenshot-service/.ready")

        // Set working directory
        .setWorkdir("/home/user/screenshot-service")

        // Configure environment
        .setEnvs({
            NODE_ENV: "production",
            PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: "true", // Use system chromium
            PUPPETEER_EXECUTABLE_PATH: "/usr/bin/chromium",
        });
}

/**
 * Template metadata
 */
export const screenshotTemplateMetadata = {
    name: "craft-screenshot",
    description: "Lightweight screenshot capture service with Chrome + Puppeteer",
    version: "1.0.0",
    tags: ["screenshot", "puppeteer", "chrome", "chromium", "capture"],
};

/**
 * Build and export the template
 */
export const screenshotTemplate = buildScreenshotTemplate();
