"use client";

import { useState, useEffect } from "react";
import { CreditCard, Trash2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

/**
 * Payment Methods Tab
 *
 * Allows users to view, add, and remove saved payment methods.
 * Similar to OpenRouter's payment method management.
 */
export function PaymentMethodsTab() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payment-methods");
      const data = await res.json();
      if (data.success) {
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
      toast.error("Failed to load payment methods");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCard = async (paymentMethodId: string) => {
    if (!confirm("Are you sure you want to remove this payment method?")) {
      return;
    }

    setRemoving(paymentMethodId);
    try {
      const res = await fetch("/api/payment-methods", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Payment method removed");
        fetchPaymentMethods();
      } else {
        toast.error(data.error || "Failed to remove payment method");
      }
    } catch (error) {
      console.error("Failed to remove payment method:", error);
      toast.error("Failed to remove payment method");
    } finally {
      setRemoving(null);
    }
  };

  const handleAddCard = async () => {
    try {
      const res = await fetch("/api/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (data.success && data.setupIntent?.clientSecret) {
        // TODO: Initialize Stripe Elements with client secret
        // This would open a modal/form to collect card details
        toast.info(
          "Card setup not yet implemented - Stripe integration needed"
        );
      } else {
        toast.error("Failed to initialize card setup");
      }
    } catch (error) {
      console.error("Failed to add payment method:", error);
      toast.error("Failed to add payment method");
    }
  };

  const getCardBrandIcon = (brand: string) => {
    // You can replace this with actual brand icons later
    return <CreditCard className="w-5 h-5 text-neutral-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Payment Methods
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your saved payment methods for quick checkout
          </p>
        </div>
        <Button onClick={handleAddCard} className="rounded-full" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Card
        </Button>
      </div>

      {/* Payment Methods List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-muted/30 border border-border animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 bg-muted rounded" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-muted rounded" />
                      <div className="h-3 w-20 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : paymentMethods.length === 0 ? (
          <div className="p-8 rounded-xl bg-muted/30 border border-border text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">
              No payment methods saved
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Add a card to speed up future purchases
            </p>
            <Button
              onClick={handleAddCard}
              variant="outline"
              className="rounded-full"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Card
            </Button>
          </div>
        ) : (
          paymentMethods.map((method) => (
            <div
              key={method.id}
              className="p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {getCardBrandIcon(method.brand)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {method.brand.toUpperCase()} •••• {method.last4}
                      </p>
                      {method.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          <Check className="w-3 h-3" />
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Expires {method.expMonth}/{method.expYear}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveCard(method.id)}
                  disabled={removing === method.id}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 disabled:opacity-50 transition-colors"
                  title="Remove card"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Section */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border">
        <h4 className="text-sm font-semibold text-foreground mb-2">
          Secure Payment Processing
        </h4>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>
              Your payment information is encrypted and securely stored by
              Stripe
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>We never store your full card number or CVV</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>You can remove payment methods at any time</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
