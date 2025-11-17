/**
 * Credit Update Events
 * Utility for notifying the frontend when credits have been updated
 */

/**
 * Dispatch a custom event to notify components that credits have been updated
 * This triggers a refresh of the credit balance in the dashboard header
 * 
 * Usage: Call this after a successful payment or token purchase
 */
export function notifyCreditUpdate() {
    if (typeof window !== "undefined") {
        const event = new CustomEvent("credits-updated");
        window.dispatchEvent(event);
        console.log("💰 Credit update event dispatched");
    }
}

/**
 * Listen for credit update events (used internally by useCreditBalance hook)
 * @param callback Function to call when credits are updated
 * @returns Cleanup function to remove the event listener
 */
export function onCreditUpdate(callback: () => void): () => void {
    if (typeof window !== "undefined") {
        window.addEventListener("credits-updated", callback);
        return () => window.removeEventListener("credits-updated", callback);
    }
    return () => { };
}
