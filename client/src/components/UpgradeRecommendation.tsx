import { AlertCircle, AlertTriangle, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

interface Recommendation {
  type: string;
  severity: "critical" | "warning" | "info";
  message: string;
  suggestion: string;
  usagePercent?: number;
  currentLimit?: number;
  nextLimit?: number;
  nextPlanId: number;
  nextPlanName: string;
}

interface UpgradeRecommendationProps {
  recommendations: Recommendation[];
  onUpgradeClick?: (planId: number, planName: string) => void;
}

export function UpgradeRecommendation({ recommendations, onUpgradeClick }: UpgradeRecommendationProps) {
  const [dismissedTypes, setDismissedTypes] = useState<Set<string>>(new Set());

  if (recommendations.length === 0 || dismissedTypes.size === recommendations.length) {
    return null;
  }

  const visibleRecommendations = recommendations.filter((r) => !dismissedTypes.has(r.type));

  const handleDismiss = (type: string) => {
    const newDismissed = new Set(dismissedTypes);
    newDismissed.add(type);
    setDismissedTypes(newDismissed);
  };

  return (
    <div className="space-y-4">
      {visibleRecommendations.map((rec) => (
        <Card
          key={rec.type}
          className={`border-l-4 p-4 ${
            rec.severity === "critical"
              ? "border-l-red-500 bg-red-50 dark:bg-red-900/20"
              : rec.severity === "warning"
                ? "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                : "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {rec.severity === "critical" ? (
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              ) : rec.severity === "warning" ? (
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              ) : (
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              )}

              <div className="flex-1">
                <h3 className={`font-semibold mb-1 ${
                  rec.severity === "critical"
                    ? "text-red-900 dark:text-red-100"
                    : rec.severity === "warning"
                      ? "text-yellow-900 dark:text-yellow-100"
                      : "text-blue-900 dark:text-blue-100"
                }`}>
                  {rec.message}
                </h3>

                {rec.usagePercent !== undefined && (
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          rec.severity === "critical"
                            ? "bg-red-600"
                            : rec.severity === "warning"
                              ? "bg-yellow-600"
                              : "bg-blue-600"
                        }`}
                        style={{ width: `${rec.usagePercent}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {rec.usagePercent.toFixed(0)}% of limit used
                    </p>
                  </div>
                )}

                <p className={`text-sm mb-3 ${
                  rec.severity === "critical"
                    ? "text-red-800 dark:text-red-200"
                    : rec.severity === "warning"
                      ? "text-yellow-800 dark:text-yellow-200"
                      : "text-blue-800 dark:text-blue-200"
                }`}>
                  {rec.suggestion}
                </p>

                <Button
                  size="sm"
                  className={`${
                    rec.severity === "critical"
                      ? "bg-red-600 hover:bg-red-700"
                      : rec.severity === "warning"
                        ? "bg-yellow-600 hover:bg-yellow-700"
                        : "bg-blue-600 hover:bg-blue-700"
                  } text-white`}
                  onClick={() => onUpgradeClick?.(rec.nextPlanId, rec.nextPlanName)}
                >
                  Upgrade to {rec.nextPlanName}
                </Button>
              </div>
            </div>

            <button
              onClick={() => handleDismiss(rec.type)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
