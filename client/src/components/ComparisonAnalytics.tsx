import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { useState } from "react";
import { TrendingUp, X } from "lucide-react";

interface CardStat {
  id: number;
  cardId: string;
  walletAddCount: number;
  walletAddAppleCount: number;
  walletAddGoogleCount: number;
  qrScanCount: number;
  cardViewCount: number;
  cardShareCount: number;
  vcardDownloadCount: number;
  qrDownloadCount: number;
}

interface ComparisonAnalyticsProps {
  cardStats: CardStat[];
  onClose: () => void;
}

export default function ComparisonAnalytics({ cardStats, onClose }: ComparisonAnalyticsProps) {
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  const handleToggleCard = (cardId: string) => {
    setSelectedCards((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };

  const comparisonData = selectedCards
    .map((cardId) => cardStats.find((stat) => stat.cardId === cardId))
    .filter(Boolean) as CardStat[];

  // Prepare data for comparison chart
  const chartData = comparisonData.map((stat) => ({
    name: `Card ${stat.cardId.slice(0, 8)}`,
    walletAdds: stat.walletAddCount,
    qrScans: stat.qrScanCount,
    views: stat.cardViewCount,
    shares: stat.cardShareCount,
  }));

  // Calculate comparison metrics
  const metrics = [
    { label: "Wallet Additions", key: "walletAddCount" },
    { label: "QR Scans", key: "qrScanCount" },
    { label: "Card Views", key: "cardViewCount" },
    { label: "Shares", key: "cardShareCount" },
    { label: "vCard Downloads", key: "vcardDownloadCount" },
    { label: "QR Downloads", key: "qrDownloadCount" },
  ];

  const getMetricComparison = (key: string) => {
    return comparisonData.map((stat) => ({
      name: `Card ${stat.cardId.slice(0, 8)}`,
      value: (stat as any)[key],
    }));
  };

  const getTopCard = (key: string): CardStat | null => {
    if (comparisonData.length === 0) return null;
    return comparisonData.reduce((max, current) =>
      (current as any)[key] > (max as any)[key] ? current : max
    );
  };

  return (
    <div className="space-y-6">
      {/* Card Selection */}
      <Card className="backdrop-blur-xl bg-white/80 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Compare Cards
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
          <CardDescription>Select 2 or more cards to compare performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {cardStats.map((stat) => (
              <div key={stat.cardId} className="flex items-center space-x-2">
                <Checkbox
                  id={stat.cardId}
                  checked={selectedCards.includes(stat.cardId)}
                  onCheckedChange={() => handleToggleCard(stat.cardId)}
                />
                <Label
                  htmlFor={stat.cardId}
                  className="text-sm cursor-pointer flex-1"
                >
                  Card {stat.cardId.slice(0, 8)}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedCards.length >= 2 && (
        <>
          {/* Overview Chart */}
          <Card className="backdrop-blur-xl bg-white/80 border-white/20">
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Key metrics comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="walletAdds" fill="#3b82f6" />
                  <Bar dataKey="qrScans" fill="#10b981" />
                  <Bar dataKey="views" fill="#f59e0b" />
                  <Bar dataKey="shares" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.map((metric) => {
              const topCard = getTopCard(metric.key);
              const comparisonValues = getMetricComparison(metric.key);

              return (
                <Card key={metric.key} className="backdrop-blur-xl bg-white/80 border-white/20">
                  <CardHeader>
                    <CardTitle className="text-base">{metric.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {comparisonValues.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-slate-900">
                              {item.value}
                            </span>
                            {topCard?.cardId === comparisonData.find((c) => c.cardId.includes(item.name.slice(-8)))?.cardId && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                Top
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Performance Insights */}
          <Card className="backdrop-blur-xl bg-white/80 border-white/20">
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.map((metric) => {
                  const topCard = getTopCard(metric.key);
                  const values = comparisonData.map((stat) => (stat as any)[metric.key]);
                  const maxValue = Math.max(...values);
                  const minValue = Math.min(...values);
                  const difference = maxValue - minValue;
                  const percentDiff =
                    minValue > 0 ? ((difference / minValue) * 100).toFixed(1) : "N/A";

                  return (
                    <div key={metric.key} className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm font-medium mb-1">{metric.label}</p>
                      <p className="text-xs text-slate-600">
                        Top performer: <span className="font-semibold">Card {topCard?.cardId.slice(0, 8)}</span> with{" "}
                        <span className="font-semibold">{maxValue}</span> {metric.label.toLowerCase()}
                        {percentDiff !== "N/A" && (
                          <>
                            {" "}
                            ({percentDiff}% higher than lowest)
                          </>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {selectedCards.length > 0 && selectedCards.length < 2 && (
        <Card className="backdrop-blur-xl bg-white/80 border-white/20">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 text-center">
              Select at least 2 cards to enable comparison
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
