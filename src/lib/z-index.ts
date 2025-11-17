/**
 * Centralized z-index system for consistent layering throughout the application.
 * 
 * Usage:
 * import { Z_INDEX } from '@/lib/z-index';
 * className={`fixed inset-0 z-[${Z_INDEX.MODAL_OVERLAY}]`}
 * 
 * Layer hierarchy (from lowest to highest):
 * - Base: 0 (default layer)
 * - Dropdown: 50 (dropdowns, popovers, tooltips)
 * - Sticky: 40 (sticky headers, navigation)
 * - Modal overlay: 60 (modal backgrounds)
 * - Modal content: 61 (modal dialogs)
 * - Toast: 70 (notifications, toasts)
 */

export const Z_INDEX = {
    // Base layer
    BASE: 0,
    ABOVE_BASE: 10,

    // Navigation and headers
    STICKY_HEADER: 40,

    // Dropdowns, popovers, and tooltips
    DROPDOWN: 50,
    POPOVER: 50,
    TOOLTIP: 50,

    // Modals and overlays
    MODAL_OVERLAY: 60,
    MODAL_CONTENT: 61,

    // Notifications and toasts
    TOAST: 70,
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;
