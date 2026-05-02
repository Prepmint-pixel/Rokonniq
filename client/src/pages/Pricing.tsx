import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { CheckoutForm } from "@/components/CheckoutForm";

export function Pricing() {
  const { user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const { data: plans } = trpc.subscriptions.getPlans.useQuery();

  const features = {
    free: [
      "1 digital contact card",
      "Basic customization",
      "QR code sharing",
      "100 CRM contacts",
      "Email & phone sharing",
    ],
    pro: [
      "Everything in Free",
      "5 digital contact cards",
      "Advanced customization",
      "Analytics dashboard",
      "1,000 CRM contacts",
      "Email campaigns",
      "Automated workflows",
      "Apple & Google Wallet",
    ],
    enterprise: [
      "Everything in Pro",
      "Unlimited cards",
      "Team management (5 members)",
      "Unlimited CRM contacts",
      "Advanced analytics",
      "Priority support",
      "Custom branding",
      "API access",
    ],
  };

  // Find plan details from API
  const proPlan = plans?.find((p) => p.name === "pro");
  const enterprisePlan = plans?.find((p) => p.name === "enterprise");

  if (selectedPlanId && proPlan) {
    const plan = selectedPlanId === 2 ? proPlan : enterprisePlan;
    if (plan) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
          <div className="max-w-2xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => setSelectedPlanId(null)}
              className="mb-8 text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2"
            >
              ← Back to Plans
            </button>

            {/* Checkout Form */}
            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
              <CheckoutForm
                planId={selectedPlanId.toString()}
                planName={plan.displayName}
                planPrice={billingPeriod === "monthly" ? plan.price : Math.floor(plan.price * 12 * 0.8)}
                onSuccess={() => setSelectedPlanId(null)}
                onError={(error) => console.error("Checkout error:", error)}
              />
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-[#a8bdd6] mb-8">Choose the perfect plan for your needs</p>

          {/* Billing Toggle */}
          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                billingPeriod === "monthly"
                  ? "bg-[#1a4fa8] text-white"
                  : "bg-slate-700 text-[#a8bdd6] hover:bg-slate-600"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                billingPeriod === "yearly"
                  ? "bg-[#1a4fa8] text-white"
                  : "bg-slate-700 text-[#a8bdd6] hover:bg-slate-600"
              }`}
            >
              Yearly (Save 20%)
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Free Plan */}
          <Card className="bg-slate-800 border-slate-700 overflow-hidden hover:border-slate-600 transition">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <p className="text-[#a8bdd6] mb-6">Perfect for getting started</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-[#a8bdd6] ml-2">/month</span>
              </div>

              <Button
                className="w-full bg-slate-700 hover:bg-slate-600 text-white mb-8"
                disabled={user?.id ? true : false}
              >
                {user?.id ? "Current Plan" : "Get Started"}
              </Button>

              <div className="space-y-4">
                {features.free.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-[#a8bdd6]">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Pro Plan */}
          <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-600 overflow-hidden relative">
            <div className="absolute top-0 right-0 bg-[#1a4fa8] text-white px-4 py-1 text-sm font-semibold">
              Most Popular
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <p className="text-blue-200 mb-6">For professionals & small teams</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">
                  ${billingPeriod === "monthly" ? "29" : "290"}
                </span>
                <span className="text-blue-200 ml-2">/{billingPeriod === "monthly" ? "month" : "year"}</span>
              </div>

              <Button
                className="w-full bg-[#1a4fa8] hover:bg-[#0f3478] text-white mb-8"
                onClick={() => setSelectedPlanId(2)}
              >
                Upgrade to Pro
              </Button>

              <div className="space-y-4">
                {features.pro.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-blue-100">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Enterprise Plan */}
          <Card className="bg-slate-800 border-slate-700 overflow-hidden hover:border-slate-600 transition">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
              <p className="text-[#a8bdd6] mb-6">For large teams & organizations</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">
                  ${billingPeriod === "monthly" ? "99" : "990"}
                </span>
                <span className="text-[#a8bdd6] ml-2">/{billingPeriod === "monthly" ? "month" : "year"}</span>
              </div>

              <Button
                className="w-full bg-slate-700 hover:bg-slate-600 text-white mb-8"
                onClick={() => setSelectedPlanId(3)}
              >
                Contact Sales
              </Button>

              <div className="space-y-4">
                {features.enterprise.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-[#a8bdd6]">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Plan Comparison Table */}
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 mb-12 overflow-x-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Plan Comparison</h2>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="pb-4 text-[#a8bdd6] font-semibold">Feature</th>
                <th className="pb-4 text-[#a8bdd6] font-semibold text-center">Free</th>
                <th className="pb-4 text-[#a8bdd6] font-semibold text-center">Pro</th>
                <th className="pb-4 text-[#a8bdd6] font-semibold text-center">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-700">
                <td className="py-4 text-[#a8bdd6]">Digital Contact Cards</td>
                <td className="py-4 text-center text-[#a8bdd6]">1</td>
                <td className="py-4 text-center text-[#a8bdd6]">5</td>
                <td className="py-4 text-center text-[#a8bdd6]">Unlimited</td>
              </tr>
              <tr className="border-b border-slate-700">
                <td className="py-4 text-[#a8bdd6]">CRM Contacts</td>
                <td className="py-4 text-center text-[#a8bdd6]">100</td>
                <td className="py-4 text-center text-[#a8bdd6]">1,000</td>
                <td className="py-4 text-center text-[#a8bdd6]">Unlimited</td>
              </tr>
              <tr className="border-b border-slate-700">
                <td className="py-4 text-[#a8bdd6]">Analytics</td>
                <td className="py-4 text-center">
                  <Check className="w-5 h-5 text-gray-500 mx-auto" />
                </td>
                <td className="py-4 text-center">
                  <Check className="w-5 h-5 text-green-400 mx-auto" />
                </td>
                <td className="py-4 text-center">
                  <Check className="w-5 h-5 text-green-400 mx-auto" />
                </td>
              </tr>
              <tr className="border-b border-slate-700">
                <td className="py-4 text-[#a8bdd6]">Workflows</td>
                <td className="py-4 text-center">
                  <Check className="w-5 h-5 text-gray-500 mx-auto" />
                </td>
                <td className="py-4 text-center">
                  <Check className="w-5 h-5 text-green-400 mx-auto" />
                </td>
                <td className="py-4 text-center">
                  <Check className="w-5 h-5 text-green-400 mx-auto" />
                </td>
              </tr>
              <tr className="border-b border-slate-700">
                <td className="py-4 text-[#a8bdd6]">Email Campaigns</td>
                <td className="py-4 text-center">
                  <Check className="w-5 h-5 text-gray-500 mx-auto" />
                </td>
                <td className="py-4 text-center">
                  <Check className="w-5 h-5 text-green-400 mx-auto" />
                </td>
                <td className="py-4 text-center">
                  <Check className="w-5 h-5 text-green-400 mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="py-4 text-[#a8bdd6]">Team Members</td>
                <td className="py-4 text-center text-[#a8bdd6]">1</td>
                <td className="py-4 text-center text-[#a8bdd6]">1</td>
                <td className="py-4 text-center text-[#a8bdd6]">5+</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* FAQ Section */}
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-white mb-2">Can I change plans?</h3>
              <p className="text-[#a8bdd6]">Yes, you can upgrade or downgrade your plan anytime. Changes take effect at your next billing cycle.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Is there a free trial?</h3>
              <p className="text-[#a8bdd6]">Start with our Free plan with no credit card required. Upgrade anytime to access premium features.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">What payment methods do you accept?</h3>
              <p className="text-[#a8bdd6]">We accept all major credit cards, debit cards, and digital payment methods through Stripe.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Do you offer refunds?</h3>
              <p className="text-[#a8bdd6]">We offer a 30-day money-back guarantee if you're not satisfied with your subscription.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Can I save my payment method?</h3>
              <p className="text-[#a8bdd6]">Yes! During checkout, you can opt-in to save your payment method for faster checkout on future purchases.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">How secure is my payment information?</h3>
              <p className="text-[#a8bdd6]">All payments are processed securely through Stripe. We never store your full card details.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
