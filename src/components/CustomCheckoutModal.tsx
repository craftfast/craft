"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  CreditCard,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  SUGGESTED_TOPUP_AMOUNTS,
  getCheckoutAmount,
  getFeeBreakdown,
  MINIMUM_BALANCE_AMOUNT,
  PLATFORM_FEE_PERCENT,
  GST_PERCENT,
} from "@/lib/pricing-constants";
import {
  COUNTRIES,
  STATES_BY_COUNTRY,
  TAX_ID_INFO,
  getTaxIdInfo,
} from "@/data";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface BillingAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

interface BillingInfo {
  billingName?: string | null;
  billingCountry?: string | null;
  billingAddress?: BillingAddress | null;
  taxId?: string | null;
  taxIdCountry?: string | null;
  sendInvoiceEmail?: boolean;
}

interface CustomCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Custom Checkout Modal - OpenRouter Style
 *
 * A clean, modern checkout UI using Razorpay payment gateway.
 * Features:
 * - Saved payment method selection
 * - Clear pricing breakdown with service fees
 * - Quick amount selection buttons
 * - Custom amount input
 * - Billing address and Tax ID management
 * - Auto-invoicing options
 * - Smooth animations and transitions
 * - Multi-currency support (INR for India, USD for others)
 */
export default function CustomCheckoutModal({
  isOpen,
  onClose,
  onSuccess,
}: CustomCheckoutModalProps) {
  const [amount, setAmount] = useState<number>(50);
  const [loading, setLoading] = useState(false);
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({});
  const [loadingBillingInfo, setLoadingBillingInfo] = useState(true);

  // Exchange rate for INR payments
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loadingExchangeRate, setLoadingExchangeRate] = useState(false);

  // Billing form states
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [showTaxIdForm, setShowTaxIdForm] = useState(false);
  const [savingBillingInfo, setSavingBillingInfo] = useState(false);

  // Form values
  const [taxIdInput, setTaxIdInput] = useState("");
  const [taxIdCountry, setTaxIdCountry] = useState("");
  const [billingName, setBillingName] = useState("");
  const [billingCountry, setBillingCountry] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [sendInvoiceEmail, setSendInvoiceEmail] = useState(false);

  // Fetch billing info on mount
  useEffect(() => {
    if (isOpen) {
      fetchBillingInfo();
    }
  }, [isOpen]);

  // Fetch exchange rate for INR conversion (all payments are in INR)
  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (isOpen) {
        setLoadingExchangeRate(true);
        try {
          const res = await fetch("/api/exchange-rate");
          const data = await res.json();
          if (data.success && data.rate) {
            setExchangeRate(data.rate);
          } else {
            // API should always return a rate (with fallback), but handle edge case
            setExchangeRate(null);
          }
        } catch (error) {
          console.error("Failed to fetch exchange rate:", error);
          // Network error - will show without INR conversion
          setExchangeRate(null);
        } finally {
          setLoadingExchangeRate(false);
        }
      }
    };

    fetchExchangeRate();
  }, [isOpen]);

  const fetchBillingInfo = async () => {
    try {
      setLoadingBillingInfo(true);
      const res = await fetch("/api/user/billing-info");
      const data = await res.json();

      if (data.success && data.billingInfo) {
        setBillingInfo(data.billingInfo);
        // Populate form fields
        setTaxIdInput(data.billingInfo.taxId || "");
        setTaxIdCountry(data.billingInfo.taxIdCountry || "");
        setBillingName(data.billingInfo.billingName || "");
        setBillingCountry(data.billingInfo.billingCountry || "");
        setAddressLine1(data.billingInfo.billingAddress?.line1 || "");
        setAddressLine2(data.billingInfo.billingAddress?.line2 || "");
        setCity(data.billingInfo.billingAddress?.city || "");
        setState(data.billingInfo.billingAddress?.state || "");
        setPostalCode(data.billingInfo.billingAddress?.postalCode || "");
        setSendInvoiceEmail(data.billingInfo.sendInvoiceEmail || false);
      }
    } catch (error) {
      console.error("Failed to fetch billing info:", error);
    } finally {
      setLoadingBillingInfo(false);
    }
  };

  const saveBillingAddress = async () => {
    try {
      setSavingBillingInfo(true);
      const res = await fetch("/api/user/billing-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingName,
          billingCountry,
          billingAddress: {
            line1: addressLine1,
            line2: addressLine2,
            city,
            state,
            postalCode,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setBillingInfo(data.billingInfo);
        setShowBillingForm(false);
        toast.success("Billing address saved");
      } else {
        toast.error(data.error || "Failed to save billing address");
      }
    } catch (error) {
      toast.error("Failed to save billing address");
    } finally {
      setSavingBillingInfo(false);
    }
  };

  const saveTaxId = async () => {
    if (!taxIdCountry) {
      toast.error("Please select a country for your Tax ID");
      return;
    }
    try {
      setSavingBillingInfo(true);
      const res = await fetch("/api/user/billing-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taxId: taxIdInput, taxIdCountry }),
      });

      const data = await res.json();
      if (data.success) {
        setBillingInfo(data.billingInfo);
        setShowTaxIdForm(false);
        toast.success("Tax ID saved");
      } else {
        toast.error(data.error || "Failed to save Tax ID");
      }
    } catch (error) {
      toast.error("Failed to save Tax ID");
    } finally {
      setSavingBillingInfo(false);
    }
  };

  const saveSendInvoiceEmail = async (enabled: boolean) => {
    try {
      const res = await fetch("/api/user/billing-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sendInvoiceEmail: enabled,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setBillingInfo(data.billingInfo);
        setSendInvoiceEmail(enabled);
      } else {
        toast.error(data.error || "Failed to update invoice settings");
        setSendInvoiceEmail(!enabled); // Revert
      }
    } catch (error) {
      toast.error("Failed to update invoice settings");
      setSendInvoiceEmail(!enabled); // Revert
    }
  };

  const handlePurchase = async () => {
    if (amount < MINIMUM_BALANCE_AMOUNT) {
      toast.error(`Minimum amount is $${MINIMUM_BALANCE_AMOUNT}`);
      return;
    }

    // Require billing country for tax calculation
    if (!billingInfo?.billingCountry) {
      toast.error("Please add your billing address to continue");
      setShowBillingForm(true);
      return;
    }

    setLoading(true);
    try {
      // Create Razorpay order
      const res = await fetch("/api/balance/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create order");
        return;
      }

      if (data.success && data.orderId) {
        // Load Razorpay SDK if not already loaded
        if (!window.Razorpay) {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }

        // Initialize Razorpay checkout
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          order_id: data.orderId,
          name: "Craft",
          description: `Top-up $${data.requestedBalance}`,
          theme: {
            color: "#000000",
            backdrop_color: "rgba(0, 0, 0, 0.85)",
          },
          handler: function (response: any) {
            toast.success("Payment successful! Credits added to your account.");

            // Dispatch credit update event
            const event = new CustomEvent("credits-updated");
            window.dispatchEvent(event);

            setLoading(false);
            onSuccess();
            onClose();
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
            animation: false,
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          console.error("Payment failed", response.error);
          toast.error("Payment failed. Please try again.");
          setLoading(false);
        });
        rzp.open();
      } else {
        toast.error(data.error || "Failed to create order");
        setLoading(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to create checkout. Please try again.");
      setLoading(false);
    }
  };

  const {
    balance: balanceAmount,
    platformFee,
    gst,
    total: checkoutAmount,
    isIndian,
  } = getFeeBreakdown(amount, billingInfo.billingCountry);

  // Helper to format billing address for display
  const formatBillingAddress = () => {
    const addr = billingInfo.billingAddress;
    const parts = [
      billingInfo.billingName,
      addr?.line1,
      addr?.city,
      billingInfo.billingCountry,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-999999 flex items-center justify-center">
      {/* Backdrop - covers everything including settings sidebar */}
      <div
        className="fixed inset-0 bg-black/60"
        style={{ zIndex: 999998 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md mx-4 bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700 hover:scrollbar-thumb-neutral-600"
        style={{ zIndex: 999999 }}
      >
        {/* Custom scrollbar styles */}
        <style jsx>{`
          div::-webkit-scrollbar {
            width: 6px;
          }
          div::-webkit-scrollbar-track {
            background: transparent;
          }
          div::-webkit-scrollbar-thumb {
            background: #525252;
            border-radius: 3px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: #6b6b6b;
          }
          select {
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23737373' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
            background-position: right 0.5rem center;
            background-repeat: no-repeat;
            background-size: 1.25em 1.25em;
            padding-right: 2rem;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
          }
          select option {
            background-color: #262626;
            color: #f5f5f5;
            padding: 8px;
          }
          select::-webkit-scrollbar {
            width: 6px;
          }
          select::-webkit-scrollbar-track {
            background: #262626;
          }
          select::-webkit-scrollbar-thumb {
            background: #525252;
            border-radius: 3px;
          }
          select::-webkit-scrollbar-thumb:hover {
            background: #6b6b6b;
          }
        `}</style>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800 sticky top-0 bg-neutral-900 z-10">
          <h2 className="text-xl font-semibold text-neutral-100">
            Purchase Credits
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Amount Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-neutral-300">
              Amount
            </label>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {SUGGESTED_TOPUP_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    amount === amt
                      ? "bg-neutral-700 text-neutral-100 border-2 border-neutral-500"
                      : "bg-neutral-800/30 text-neutral-400 border border-neutral-700 hover:border-neutral-600"
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            {/* Custom Amount Input */}
            <div>
              <label className="text-xs font-medium text-neutral-400 mb-1.5 block">
                Custom Amount
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={MINIMUM_BALANCE_AMOUNT}
                placeholder={`Min $${MINIMUM_BALANCE_AMOUNT}`}
                className="h-12 rounded-xl bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-600"
              />
            </div>
          </div>

          {/* Billing Address Section */}
          <div className="space-y-2">
            <button
              onClick={() => setShowBillingForm(!showBillingForm)}
              className="w-full flex items-center justify-between text-sm text-neutral-400 hover:text-neutral-300 hover:underline transition-all"
            >
              <div className="flex items-center gap-2">
                <span>Billing address</span>
                {formatBillingAddress() && (
                  <span className="text-neutral-500 text-xs truncate max-w-[180px]">
                    ({formatBillingAddress()})
                  </span>
                )}
              </div>
              {showBillingForm ? (
                <ChevronUp className="w-4 h-4 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 shrink-0" />
              )}
            </button>

            {showBillingForm && (
              <div className="p-4 rounded-xl bg-neutral-800/30 border border-neutral-700 space-y-3">
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">
                    Full name
                  </label>
                  <Input
                    placeholder="Enter your full name"
                    value={billingName}
                    onChange={(e) => setBillingName(e.target.value)}
                    className="h-10 rounded-lg bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-500 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">
                    Country or region
                  </label>
                  <select
                    value={billingCountry}
                    onChange={(e) => {
                      setBillingCountry(e.target.value);
                      setState(""); // Reset state when country changes
                    }}
                    className="w-full h-10 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-100 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-neutral-600 cursor-pointer transition-colors hover:border-neutral-600"
                  >
                    <option
                      value=""
                      className="bg-neutral-800 text-neutral-400"
                    >
                      Select country
                    </option>
                    {COUNTRIES.map((country) => (
                      <option
                        key={country.code}
                        value={country.code}
                        className="bg-neutral-800 text-neutral-100"
                      >
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">
                    Address line 1
                  </label>
                  <Input
                    placeholder="Street address"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    className="h-10 rounded-lg bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-500 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">
                    Address line 2
                  </label>
                  <Input
                    placeholder="Apartment, suite, etc. (optional)"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    className="h-10 rounded-lg bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-500 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">
                    City
                  </label>
                  <Input
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-10 rounded-lg bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-500 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">
                    PIN
                  </label>
                  <Input
                    placeholder="Postal / ZIP code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="h-10 rounded-lg bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-500 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">
                    State / Province
                  </label>
                  {STATES_BY_COUNTRY[billingCountry] ? (
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full h-10 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-100 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-neutral-600 cursor-pointer transition-colors hover:border-neutral-600"
                    >
                      <option
                        value=""
                        className="bg-neutral-800 text-neutral-400"
                      >
                        Select state / province
                      </option>
                      {STATES_BY_COUNTRY[billingCountry].map((s) => (
                        <option
                          key={s.code}
                          value={s.code}
                          className="bg-neutral-800 text-neutral-100"
                        >
                          {s.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      placeholder="State / Province"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="h-10 rounded-lg bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-500 text-sm"
                    />
                  )}
                </div>
                <p className="text-xs text-neutral-500">
                  A billing address is{" "}
                  <span className="font-semibold">required</span> to verify your
                  identity and help prevent fraud.
                </p>
                <Button
                  onClick={saveBillingAddress}
                  disabled={savingBillingInfo}
                  size="sm"
                  className="w-full h-9 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white text-sm"
                >
                  {savingBillingInfo ? "Saving..." : "Update Address"}
                </Button>
              </div>
            )}
          </div>

          {/* Tax ID Section */}
          <div className="space-y-2">
            <button
              onClick={() => setShowTaxIdForm(!showTaxIdForm)}
              className="w-full flex items-center justify-between text-sm text-neutral-400 hover:text-neutral-300 hover:underline transition-all"
            >
              <span>Edit Tax ID</span>
              {showTaxIdForm ? (
                <ChevronUp className="w-4 h-4 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 shrink-0" />
              )}
            </button>

            {showTaxIdForm && (
              <div className="p-4 rounded-xl bg-neutral-800/30 border border-neutral-700 space-y-3">
                {/* Show saved Tax ID as chip */}
                {billingInfo.taxId && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-700 text-neutral-200 text-sm">
                      <span className="font-medium">
                        {billingInfo.taxIdCountry}
                        {TAX_ID_INFO[billingInfo.taxIdCountry || ""]?.label
                          ? ` (${
                              TAX_ID_INFO[billingInfo.taxIdCountry || ""]?.label
                            })`
                          : ""}
                      </span>
                      <span>{billingInfo.taxId}</span>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/user/billing-info", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                taxId: "",
                                taxIdCountry: "",
                              }),
                            });
                            const data = await res.json();
                            if (data.success) {
                              setBillingInfo(data.billingInfo);
                              setTaxIdInput("");
                              setTaxIdCountry("");
                              toast.success("Tax ID removed");
                            }
                          } catch {
                            toast.error("Failed to remove Tax ID");
                          }
                        }}
                        className="ml-1 p-0.5 rounded hover:bg-neutral-600 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  </div>
                )}

                {/* Inline Tax ID input like OpenRouter */}
                <div className="flex items-center gap-2">
                  <select
                    value={taxIdCountry}
                    onChange={(e) => setTaxIdCountry(e.target.value)}
                    className="h-9 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-100 text-xs px-2 focus:outline-none focus:ring-2 focus:ring-neutral-600 w-16 cursor-pointer transition-colors hover:border-neutral-600"
                  >
                    <option
                      value=""
                      className="bg-neutral-800 text-neutral-400"
                    >
                      --
                    </option>
                    {COUNTRIES.map((country) => (
                      <option
                        key={country.code}
                        value={country.code}
                        className="bg-neutral-800 text-neutral-100"
                      >
                        {country.code}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder={
                      TAX_ID_INFO[taxIdCountry]?.placeholder || "Enter Tax ID"
                    }
                    value={taxIdInput}
                    onChange={(e) => setTaxIdInput(e.target.value)}
                    className="h-10 flex-1 rounded-lg bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-500 text-sm"
                  />
                  <Button
                    onClick={saveTaxId}
                    disabled={savingBillingInfo || !taxIdCountry || !taxIdInput}
                    size="sm"
                    className="h-10 px-4 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white text-sm"
                  >
                    {savingBillingInfo ? "..." : "Save"}
                  </Button>
                </div>
                {taxIdCountry && TAX_ID_INFO[taxIdCountry] && (
                  <p className="text-xs text-neutral-500">
                    {TAX_ID_INFO[taxIdCountry].label} format:{" "}
                    {TAX_ID_INFO[taxIdCountry].placeholder}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Send Invoices Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-400">
                  Send me invoices
                </span>
                <button
                  type="button"
                  className="text-neutral-500 hover:text-neutral-400 transition-colors"
                  title="Receive an invoice via email after each purchase"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={sendInvoiceEmail}
                  onChange={(e) => saveSendInvoiceEmail(e.target.checked)}
                />
                <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-neutral-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-500 peer-checked:after:bg-neutral-200"></div>
              </label>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="p-4 rounded-xl bg-neutral-800/30 border border-neutral-700 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Balance to add</span>
              <span className="font-mono text-neutral-200">
                ${amount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">
                Platform fee ({(PLATFORM_FEE_PERCENT * 100).toFixed(0)}%)
              </span>
              <span className="font-mono text-neutral-200">
                ${platformFee.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">GST (18% on total)</span>
              <span className="font-mono text-neutral-200">
                ${gst.toFixed(2)}
              </span>
            </div>
            <div className="h-px bg-neutral-700" />
            <div className="flex justify-between text-base font-semibold pt-1">
              <span className="text-neutral-200">Total due (USD)</span>
              <span className="font-mono text-neutral-100">
                ${checkoutAmount.toFixed(2)}
              </span>
            </div>
            {/* Show INR equivalent - all payments in INR */}
            {exchangeRate && (
              <>
                <div className="flex justify-between text-base font-semibold">
                  <span className="text-neutral-200">You pay (INR)</span>
                  <span className="font-mono text-green-400">
                    ₹
                    {(checkoutAmount * exchangeRate).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 text-center">
                  Exchange rate: 1 USD = ₹{exchangeRate.toFixed(2)}
                </p>
              </>
            )}
            {loadingExchangeRate && (
              <p className="text-xs text-neutral-500 text-center">
                Fetching exchange rate...
              </p>
            )}
          </div>

          {/* Purchase Button */}
          <Button
            onClick={handlePurchase}
            disabled={loading || amount < MINIMUM_BALANCE_AMOUNT}
            className="w-full h-12 rounded-xl bg-neutral-700 hover:bg-neutral-600 text-white font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading
              ? "Opening checkout..."
              : !billingInfo?.billingCountry
              ? "Add Billing Address to Continue"
              : "Purchase"}
          </Button>

          {/* Error Message */}
          {amount < MINIMUM_BALANCE_AMOUNT && (
            <p className="text-xs text-red-400 text-center">
              Minimum amount is ${MINIMUM_BALANCE_AMOUNT}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
