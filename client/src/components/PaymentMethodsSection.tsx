import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { AlertCircle, Check, CreditCard, Loader2, Plus, Trash2, X } from "lucide-react";

export function PaymentMethodsSection() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const { data: paymentMethods, isLoading } = trpc.paymentMethods.getPaymentMethods.useQuery();
  const { data: defaultMethod } = trpc.paymentMethods.getDefaultPaymentMethod.useQuery();
  const setDefaultMutation = trpc.paymentMethods.setDefaultPaymentMethod.useMutation();
  const deleteMutation = trpc.paymentMethods.deletePaymentMethod.useMutation();
  const createSetupIntentMutation = trpc.paymentMethods.createSetupIntent.useMutation();

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultMutation.mutateAsync({ paymentMethodId: id });
    } catch (error) {
      console.error("Failed to set default payment method:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ paymentMethodId: id });
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete payment method:", error);
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      const result = await createSetupIntentMutation.mutateAsync();
      // In a real implementation, you would use Stripe Elements to confirm the setup intent
      console.log("Setup intent created:", result);
      setShowAddForm(false);
    } catch (error) {
      console.error("Failed to create setup intent:", error);
    }
  };

  const formatCardBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  const isExpired = (expMonth: number, expYear: number) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (expYear < currentYear) return true;
    if (expYear === currentYear && expMonth < currentMonth) return true;
    return false;
  };

  if (isLoading) {
    return (
      <Card className="bg-white border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Payment Methods</h2>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-slate-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Payment Methods</h2>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      {paymentMethods && paymentMethods.length > 0 ? (
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`border-2 rounded-lg p-4 flex items-center justify-between transition ${
                method.isDefault
                  ? "border-blue-600 bg-blue-50"
                  : isExpired(method.cardExpMonth, method.cardExpYear)
                    ? "border-red-200 bg-red-50"
                    : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <CreditCard className="w-8 h-8 text-slate-600" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {formatCardBrand(method.cardBrand)} •••• {method.cardLast4}
                    </span>
                    {method.isDefault && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Default
                      </span>
                    )}
                    {isExpired(method.cardExpMonth, method.cardExpYear) && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Expired
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-600">
                    Expires {String(method.cardExpMonth).padStart(2, "0")}/{method.cardExpYear}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!method.isDefault && (
                  <Button
                    onClick={() => handleSetDefault(method.id)}
                    variant="outline"
                    size="sm"
                    disabled={setDefaultMutation.isPending}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Set Default
                  </Button>
                )}
                <button
                  onClick={() => setShowDeleteConfirm(method.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Delete Confirmation */}
              {showDeleteConfirm === method.id && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <div className="bg-white rounded-lg p-4 shadow-lg">
                    <p className="font-semibold text-slate-900 mb-4">Delete payment method?</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleDelete(method.id)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                      </Button>
                      <Button
                        onClick={() => setShowDeleteConfirm(null)}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">No payment methods added yet</p>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add Your First Payment Method
          </Button>
        </div>
      )}

      {/* Add Payment Method Form */}
      {showAddForm && (
        <div className="mt-6 p-6 bg-slate-50 rounded-lg border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Add Payment Method</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              Click below to securely add your credit card. Your payment information is processed by Stripe.
            </p>
          </div>

          <div className="space-y-4">
            {/* Stripe Elements would go here in a real implementation */}
            <div className="h-12 bg-white border-2 border-slate-300 rounded-lg flex items-center justify-center text-slate-500">
              Stripe Card Element (requires Stripe Elements integration)
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAddPaymentMethod}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={createSetupIntentMutation.isPending}
              >
                {createSetupIntentMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Add Card"
                )}
              </Button>
              <Button
                onClick={() => setShowAddForm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
