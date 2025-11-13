"use client";

/**
 * Screenshot Capture Utility
 * 
 * Captures screenshots of iframe content (sandbox preview) for project thumbnails.
 * Uses html2canvas to capture the visible preview area.
 */

/**
 * Capture a screenshot of an iframe element
 * 
 * Note: Due to CORS restrictions, we cannot directly capture iframe content.
 * Instead, we capture a placeholder or use Puppeteer server-side.
 * 
 * For client-side capture, we provide a postMessage-based approach where
 * the iframe sends us a screenshot of itself.
 * 
 * @param iframeElement - The iframe element to capture
 * @returns Promise<string> - Base64 data URL of the screenshot
 */
export async function captureIframeScreenshot(
    iframeElement: HTMLIFrameElement
): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            // Check if iframe is accessible
            if (!iframeElement || !iframeElement.contentWindow) {
                reject(new Error("Invalid iframe element"));
                return;
            }

            // Set up message listener for screenshot response
            const handleMessage = (event: MessageEvent) => {
                // Security: Verify origin if needed
                // if (event.origin !== expectedOrigin) return;

                if (event.data.type === "SCREENSHOT_RESPONSE") {
                    window.removeEventListener("message", handleMessage);

                    if (event.data.error) {
                        reject(new Error(event.data.error));
                    } else {
                        resolve(event.data.screenshot);
                    }
                }
            };

            window.addEventListener("message", handleMessage);

            // Request screenshot from iframe
            iframeElement.contentWindow.postMessage(
                { type: "CAPTURE_SCREENSHOT" },
                "*" // Use specific origin in production
            );

            // Timeout after 10 seconds
            setTimeout(() => {
                window.removeEventListener("message", handleMessage);
                reject(new Error("Screenshot capture timeout"));
            }, 10000);

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Capture screenshot of the current page (for embedding in iframe)
 * This should be injected into the preview iframe's page.
 * 
 * @returns Promise<string> - Base64 data URL of the screenshot
 */
export async function captureCurrentPage(): Promise<string> {
    try {
        // Dynamically import html2canvas
        const html2canvas = (await import("html2canvas")).default;

        // Capture the entire document body
        const canvas = await html2canvas(document.body, {
            allowTaint: true,
            useCORS: true,
            logging: false,
            width: window.innerWidth,
            height: window.innerHeight,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
        });

        // Convert to base64
        return canvas.toDataURL("image/png", 0.8); // 0.8 quality to reduce size
    } catch (error) {
        throw new Error(`Failed to capture screenshot: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Upload screenshot to the server
 * 
 * @param projectId - Project ID
 * @param screenshotDataUrl - Base64 data URL of the screenshot
 * @returns Promise<{success: boolean, thumbnailUrl?: string}>
 */
export async function uploadScreenshot(
    projectId: string,
    screenshotDataUrl: string
): Promise<{ success: boolean; thumbnailUrl?: string; error?: string }> {
    try {
        const response = await fetch(`/api/sandbox/${projectId}/screenshot`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                screenshot: screenshotDataUrl,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error || "Failed to upload screenshot",
            };
        }

        return {
            success: true,
            thumbnailUrl: data.thumbnailUrl,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Inject screenshot capture listener into iframe
 * This script should be injected into the preview iframe's <head>
 * 
 * @returns Script content to inject
 */
export function getScreenshotListenerScript(): string {
    return `
        <script type="module">
            // Listen for screenshot capture requests
            window.addEventListener('message', async (event) => {
                if (event.data.type === 'CAPTURE_SCREENSHOT') {
                    try {
                        // Wait for page to be fully loaded
                        await new Promise(resolve => {
                            if (document.readyState === 'complete') {
                                resolve();
                            } else {
                                window.addEventListener('load', resolve);
                            }
                        });

                        // Dynamically import html2canvas
                        const { default: html2canvas } = await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm');

                        // Capture screenshot
                        const canvas = await html2canvas(document.body, {
                            allowTaint: true,
                            useCORS: true,
                            logging: false,
                            width: window.innerWidth,
                            height: window.innerHeight,
                        });

                        // Convert to base64
                        const screenshot = canvas.toDataURL('image/png', 0.8);

                        // Send back to parent
                        window.parent.postMessage({
                            type: 'SCREENSHOT_RESPONSE',
                            screenshot: screenshot,
                        }, '*');
                    } catch (error) {
                        // Send error back to parent
                        window.parent.postMessage({
                            type: 'SCREENSHOT_RESPONSE',
                            error: error.message,
                        }, '*');
                    }
                }
            });
        </script>
    `;
}
