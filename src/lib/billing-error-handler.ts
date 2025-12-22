/**
 * Billing Error Handler Utility
 *
 * Provides consistent handling of 402 Payment Required errors across the app.
 * All billing-protected API endpoints return 402 with a JSON body like:
 * { error: "Insufficient balance...", balance: number, required: number }
 */

import { toast } from "sonner";

export interface BillingErrorResponse {
    error: string;
    balance?: number;
    required?: number;
}

export interface BillingErrorResult {
    isBillingError: boolean;
    message: string;
    balance?: number;
    required?: number;
}

/**
 * Check if a response is a billing error (402 Payment Required)
 */
export function isBillingError(response: Response): boolean {
    return response.status === 402;
}

/**
 * Parse a billing error response
 */
export async function parseBillingError(
    response: Response
): Promise<BillingErrorResult> {
    if (!isBillingError(response)) {
        return { isBillingError: false, message: "" };
    }

    try {
        const data: BillingErrorResponse = await response.json();
        return {
            isBillingError: true,
            message: data.error || "Insufficient balance. Please add credits.",
            balance: data.balance,
            required: data.required,
        };
    } catch {
        return {
            isBillingError: true,
            message: "Insufficient balance. Please add credits.",
        };
    }
}

/**
 * Handle a billing error with a toast notification
 * Returns true if it was a billing error, false otherwise
 */
export async function handleBillingError(response: Response): Promise<boolean> {
    if (!isBillingError(response)) {
        return false;
    }

    const { message, balance } = await parseBillingError(response);

    let toastMessage = message;
    if (balance !== undefined) {
        toastMessage = `${message} Current balance: $${balance.toFixed(2)}`;
    }

    toast.error(toastMessage, {
        action: {
            label: "Add Credits",
            onClick: () => window.open("/settings/billing", "_blank"),
        },
        duration: 8000,
    });

    return true;
}

/**
 * Check response for billing error and throw a custom error if found
 * Use this in try/catch blocks for cleaner error handling
 */
export async function checkBillingResponse(response: Response): Promise<void> {
    if (isBillingError(response)) {
        const { message, balance, required } = await parseBillingError(response);
        const error = new Error(message) as Error & {
            isBillingError: boolean;
            balance?: number;
            required?: number;
        };
        error.isBillingError = true;
        error.balance = balance;
        error.required = required;
        throw error;
    }
}

/**
 * Type guard for billing errors caught in catch blocks
 */
export function isBillingErrorCaught(
    error: unknown
): error is Error & { isBillingError: boolean; balance?: number } {
    return (
        error instanceof Error &&
        "isBillingError" in error &&
        (error as Error & { isBillingError: boolean }).isBillingError === true
    );
}

/**
 * Show billing error toast from a caught error
 */
export function showBillingErrorToast(
    error: Error & { balance?: number }
): void {
    let toastMessage = error.message;
    if (error.balance !== undefined) {
        toastMessage = `${error.message} Current balance: $${error.balance.toFixed(2)}`;
    }

    toast.error(toastMessage, {
        action: {
            label: "Add Credits",
            onClick: () => window.open("/settings/billing", "_blank"),
        },
        duration: 8000,
    });
}
