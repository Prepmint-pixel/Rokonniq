import { Card } from "@/components/ui/card";
import { FileText, Users, Zap } from "lucide-react";

interface UsageDashboardProps {
  usage: {
    cards: number;
    contacts: number;
    workflows: number;
  };
  limits: {
    maxCards: number;
    maxContacts: number;
    hasWorkflows: boolean;
  };
}

export function UsageDashboard({ usage, limits }: UsageDashboardProps) {
  const getUsagePercent = (current: number, max: number) => {
    if (max === 0) return 0;
    return Math.min((current / max) * 100, 100);
  };

  const getUsageColor = (percent: number) => {
    if (percent >= 100) return "bg-red-600";
    if (percent >= 80) return "bg-yellow-600";
    return "bg-green-600";
  };

  const cardPercent = getUsagePercent(usage.cards, limits.maxCards);
  const contactPercent = getUsagePercent(usage.contacts, limits.maxContacts);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Resource Usage</h3>

      {/* Digital Cards */}
      <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Digital Contact Cards</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {usage.cards} of {limits.maxCards} used
              </p>
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {cardPercent.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${getUsageColor(cardPercent)}`}
            style={{ width: `${cardPercent}%` }}
          />
        </div>
      </Card>

      {/* CRM Contacts */}
      <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">CRM Contacts</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {usage.contacts} of {limits.maxContacts} used
              </p>
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {contactPercent.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${getUsageColor(contactPercent)}`}
            style={{ width: `${contactPercent}%` }}
          />
        </div>
      </Card>

      {/* Workflows */}
      <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Workflows</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {limits.hasWorkflows ? `${usage.workflows} active` : "Not included in your plan"}
              </p>
            </div>
          </div>
          {limits.hasWorkflows && (
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm rounded-full">
              Enabled
            </span>
          )}
          {!limits.hasWorkflows && (
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200 text-sm rounded-full">
              Upgrade to unlock
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
