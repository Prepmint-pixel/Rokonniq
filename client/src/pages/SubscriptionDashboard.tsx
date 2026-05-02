import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { AlertCircle, Check, ChevronRight, Download, Loader2, X } from "lucide-react";
import { useLocation } from "wouter";
import { PaymentMethodsSection } from "@/components/PaymentMethodsSection";
import { UpgradeRecommendation } from "@/components/UpgradeRecommendation";
import { UsageDashboard } from "@/components/UsageDashboard";

export default function SubscriptionDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const { data: currentSub, isLoading: subLoading } = trpc.billing.getCurrentSubscription.useQuery();
  const { data: plans } = trpc.billing.getPlans.useQuery();
  const { data: billingHistory } = trpc.billing.getBillingHistory.useQuery();
  const { data: recommendations } = trpc.recommendations.getRecommendations.useQuery();
  const { data: usage } = trpc.recommendations.getUserUsage.useQuery();
  const upgradeMutation = trpc.billing.upgradeSubscription.useMutation();
  const cancelMutation = trpc.billing.cancelSubscription.useMutation();

  const handleRecommendationUpgrade = (planId: number, planName: string) => {
    setSelectedPlanId(planId);
    setShowUpgradeDialog(true);
  };

  if (subLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  const handleUpgrade = async () => {
    if (!selectedPlanId) return;
    try {
      await upgradeMutation.mutateAsync({ newPlanId: selectedPlanId });
      setShowUpgradeDialog(false);
      setSelectedPlanId(null);
    } catch (error) {
      console.error("Upgrade failed:", error);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync();
      setShowCancelDialog(false);
    } catch (error) {
      console.error("Cancel failed:", error);
    }
  };

  const currentPlan = currentSub?.plan;
  const subscription = currentSub?.subscription;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Subscription & Billing</h1>
          <p className="text-lg text-slate-600">Manage your subscription plan and view billing history</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Current Plan Section */}
          <div className="lg:col-span-2">
            <Card className="bg-white border-slate-200 p-8 mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Current Plan</h2>

              {currentPlan ? (
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-3xl font-bold text-slate-900">{currentPlan.displayName}</h3>
                      <p className="text-slate-600 mt-2">{currentPlan.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-slate-900">
                        ${(currentPlan.price / 100).toFixed(2)}
                      </div>
                      <div className="text-slate-600">/month</div>
                    </div>
                  </div>

                  {/* Plan Features */}
                  <div className="grid md:grid-cols-2 gap-4 mb-8 py-6 border-t border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-slate-700">{currentPlan.maxCards} Digital Card{currentPlan.maxCards !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-slate-700">{currentPlan.maxContacts.toLocaleString()} CRM Contacts</span>
                    </div>
                    {currentPlan.hasAnalytics ? (
                      <div className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="text-slate-700">Analytics Dashboard</span>
                      </div>
                    ) : null}
                    {currentPlan.hasWorkflows ? (
                      <div className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="text-slate-700">Automated Workflows</span>
                      </div>
                    ) : null}
                    {currentPlan.hasEmailCampaigns ? (
                      <div className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="text-slate-700">Email Campaigns</span>
                      </div>
                    ) : null}
                    {currentPlan.hasTeamMembers ? (
                      <div className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="text-slate-700">Team Members</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Subscription Status */}
                  {subscription && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-blue-900">Status: {subscription.status}</p>
                          {subscription.currentPeriodEnd && (
                            <p className="text-sm text-blue-700 mt-1">
                              Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {currentPlan.name !== "enterprise" && (
                      <Button
                        onClick={() => setShowUpgradeDialog(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Upgrade Plan
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                    {currentPlan.name !== "free" && (
                      <Button
                        onClick={() => setShowCancelDialog(true)}
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Cancel Subscription
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-600 mb-4">No active subscription</p>
                  <Button
                    onClick={() => navigate("/pricing")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    View Plans
                  </Button>
                </div>
              )}
            </Card>

            {/* Upgrade Recommendations */}
            {recommendations && recommendations.recommendations.length > 0 && (
              <Card className="bg-white border-slate-200 p-8 mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Recommended for You</h2>
                <UpgradeRecommendation
                  recommendations={recommendations.recommendations as any}
                  onUpgradeClick={handleRecommendationUpgrade}
                />
              </Card>
            )}

            {/* Usage Dashboard */}
            {usage && (
              <Card className="bg-white border-slate-200 p-8 mb-8">
                <UsageDashboard
                  usage={usage.usage}
                  limits={{
                    maxCards: usage.plan.maxCards,
                    maxContacts: usage.plan.maxContacts,
                    hasWorkflows: Boolean(usage.plan.hasWorkflows),
                  }}
                />
              </Card>
            )}

            {/* Billing History */}
            <Card className="bg-white border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Billing History</h2>

              {billingHistory && billingHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-900">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-900">Description</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-900">Amount</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-900">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-900">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingHistory?.map((invoice: any) => (
                        <tr key={invoice.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-700">
                            {new Date(invoice.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-slate-700">{invoice.description || "Subscription"}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            ${(invoice.amount / 100).toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                invoice.status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : invoice.status === "open"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {invoice.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {invoice.pdfUrl && (
                              <a
                                href={invoice.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                              >
                                <Download className="w-4 h-4" />
                                PDF
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-600">No billing history yet</p>
                </div>
              )}
            </Card>
          </div>

          {/* Upgrade Plans Sidebar */}
          {showUpgradeDialog && (
            <div className="lg:col-span-1">
              <Card className="bg-white border-slate-200 p-6 sticky top-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Upgrade Plan</h3>
                  <button
                    onClick={() => setShowUpgradeDialog(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  {plans
                    ?.filter((p) => p.id !== currentPlan?.id && p.price > (currentPlan?.price || 0))
                    .map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`w-full p-4 rounded-lg border-2 transition ${
                          selectedPlanId === plan.id
                            ? "border-blue-600 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="text-left">
                          <div className="font-semibold text-slate-900">{plan.displayName}</div>
                          <div className="text-sm text-slate-600">${(plan.price / 100).toFixed(2)}/month</div>
                        </div>
                      </button>
                    ))}
                </div>

                <Button
                  onClick={handleUpgrade}
                  disabled={!selectedPlanId || upgradeMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {upgradeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Upgrading...
                    </>
                  ) : (
                    "Confirm Upgrade"
                  )}
                </Button>
              </Card>
            </div>
          )}

          {/* Cancel Confirmation Dialog */}
          {showCancelDialog && (
            <div className="lg:col-span-1">
              <Card className="bg-white border-red-200 p-6 sticky top-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-red-900">Cancel Subscription?</h3>
                  <button
                    onClick={() => setShowCancelDialog(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-red-800">
                    Canceling your subscription will downgrade you to the Free plan. You'll lose access to premium features.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleCancel}
                    disabled={cancelMutation.isPending}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    {cancelMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Canceling...
                      </>
                    ) : (
                      "Yes, Cancel Subscription"
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowCancelDialog(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Keep Subscription
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Payment Methods Section */}
        <PaymentMethodsSection />
      </div>
    </div>
  );
}
