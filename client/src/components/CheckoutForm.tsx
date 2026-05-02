import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface CheckoutFormProps {
  planId: string;
  planName: string;
  planPrice: string | number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function CheckoutForm({
  planId,
  planName,
  planPrice,
  onSuccess,
  onError,
}: CheckoutFormProps) {
  const [savePaymentMethod, setSavePaymentMethod] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckoutMutation = trpc.subscriptions.createCheckoutSession.useMutation();

  const handleCheckout = async () => {
    try {
      setError(null);
      setShowSuccess(false);

      // Create checkout session with save preference
      const session = await createCheckoutMutation.mutateAsync({
        planId: typeof planId === 'string' ? parseInt(planId) : planId,
        savePaymentMethod: savePaymentMethod ? 1 : 0,
      });

      // Redirect to Stripe checkout
      if (session.checkoutUrl) {
        window.location.href = session.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Checkout failed";
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  return (
    <Card className="bg-white border-slate-200 p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">{planName}</h2>
      <div className="mb-6">
        <div className="text-4xl font-bold text-slate-900">
          ${(typeof planPrice === 'string' ? parseInt(planPrice) : planPrice) / 100}
          <span className="text-lg font-normal text-slate-600">/month</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Checkout Error</p>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900">Payment Method Saved</p>
            <p className="text-sm text-green-800">
              Your card will be saved for future purchases
            </p>
          </div>
        </div>
      )}

      {/* Save Payment Method Checkbox */}
      <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={savePaymentMethod}
            onChange={(e) => {
              setSavePaymentMethod(e.target.checked);
              if (e.target.checked) {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
              }
            }}
            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <div className="flex-1">
            <p className="font-medium text-slate-900">Save for future use</p>
            <p className="text-sm text-slate-600">
              Securely save this card for faster checkout next time
            </p>
          </div>
        </label>
      </div>

      {/* Security Notice */}
      <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          🔒 Your payment information is securely processed by Stripe. We never store your full card details.
        </p>
      </div>

      {/* Checkout Button */}
      <Button
        onClick={handleCheckout}
        disabled={createCheckoutMutation.isPending}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
      >
        {createCheckoutMutation.isPending ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Proceed to Payment`
        )}
      </Button>

      {/* Terms */}
      <p className="text-xs text-slate-500 text-center mt-4">
        By clicking "Proceed to Payment", you agree to our{" "}
        <a href="/terms" className="text-blue-600 hover:underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" className="text-blue-600 hover:underline">
          Privacy Policy
        </a>
      </p>
    </Card>
  );
}
