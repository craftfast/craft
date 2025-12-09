/**
 * PostHog Reverse Proxy - Cloudflare Worker
 * 
 * Deploy this worker to your Cloudflare account to proxy PostHog requests
 * through your own domain, avoiding tracking blockers.
 * 
 * Setup:
 * 1. Go to Cloudflare Dashboard → Workers & Pages → Create Application
 * 2. Create a new Worker and paste this code
 * 3. Set up a custom domain (e.g., t.craft.fast or analytics.craft.fast)
 * 4. Update NEXT_PUBLIC_POSTHOG_HOST in your .env to use your custom domain
 */

const POSTHOG_HOST = "https://us.i.posthog.com";

export default {
    async fetch(request) {
        const url = new URL(request.url);

        // Rewrite the URL to PostHog
        const posthogUrl = new URL(url.pathname + url.search, POSTHOG_HOST);

        // Clone the request with the new URL
        const modifiedRequest = new Request(posthogUrl, {
            method: request.method,
            headers: request.headers,
            body: request.body,
            redirect: "follow",
        });

        // Forward the request to PostHog
        const response = await fetch(modifiedRequest);

        // Clone the response and add CORS headers
        const modifiedResponse = new Response(response.body, response);
        modifiedResponse.headers.set("Access-Control-Allow-Origin", "*");
        modifiedResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        modifiedResponse.headers.set("Access-Control-Allow-Headers", "Content-Type");

        return modifiedResponse;
    },
};
