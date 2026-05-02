import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BarChart3, TrendingUp, Eye, Share2, Download, Wallet, Bell, GitCompare } from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import ExportAnalyticsButton from "@/components/ExportAnalyticsButton";
import NotificationPreferencesModal from "@/components/NotificationPreferencesModal";
import ComparisonAnalytics from "@/components/ComparisonAnalytics";

export default function Analytics() {
  const { user, isAuthenticated } = useAuth();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showNotificationPrefs, setShowNotificationPrefs] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Fetch user analytics summary
  const { data: summary, isLoading: summaryLoading } = trpc.analytics.getUserSummary.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Fetch all user card stats
  const { data: cardStats, isLoading: statsLoading } = trpc.analytics.getUserCardStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Fetch selected card events
  const { data: cardEvents, isLoading: eventsLoading } = trpc.analytics.getCardEvents.useQuery(
    { cardId: selectedCardId || "", limit: 50 },
    {
      enabled: isAuthenticated && !!selectedCardId,
    }
  );

  // Fetch event counts by type for selected card
  const { data: eventCounts, isLoading: countsLoading } = trpc.analytics.getEventCountsByType.useQuery(
    { cardId: selectedCardId || "" },
    {
      enabled: isAuthenticated && !!selectedCardId,
    }
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>
          <p className="text-gray-600 mb-4">Please log in to view your analytics</p>
        </div>
      </div>
    );
  }

  if (summaryLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Prepare data for charts
  const eventTypeData = eventCounts
    ? Object.entries(eventCounts).map(([type, count]) => ({
        name: type.replace(/_/g, " ").toUpperCase(),
        value: count,
        fill: getColorForEventType(type),
      }))
    : [];

  const eventTimeline = cardEvents
    ? cardEvents
        .slice()
        .reverse()
        .map((event) => ({
          date: new Date(event.createdAt).toLocaleDateString(),
          [event.eventType]: 1,
        }))
    : [];

  // Aggregate timeline data
  const timelineData: Record<string, any> = {};
  eventTimeline.forEach((item) => {
    const existing = timelineData[item.date] || { date: item.date };
    Object.assign(existing, item);
    timelineData[item.date] = existing;
  });
  const aggregatedTimeline = Object.values(timelineData);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-[#0d1e3a] mb-2">Analytics Dashboard</h1>
              <p className="text-[#3a5070]">Track your contact card engagement and wallet additions</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
                className="flex items-center gap-2"
              >
                <GitCompare className="w-4 h-4" />
                Compare
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNotificationPrefs(true)}
                className="flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                Alerts
              </Button>
              {cardStats && cardStats.length > 0 && (
                <ExportAnalyticsButton
                  cardStats={cardStats}
                  events={cardEvents || []}
                  summary={summary || { totalWalletAdds: 0, totalQrScans: 0, totalCardViews: 0, totalShares: 0 }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="backdrop-blur-xl bg-white/80 border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#3a5070] flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Total Wallet Adds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#0d1e3a]">{summary?.totalWalletAdds || 0}</div>
              <p className="text-xs text-[#7a96b8] mt-1">Apple + Google Wallet</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/80 border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#3a5070] flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Card Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#0d1e3a]">{summary?.totalCardViews || 0}</div>
              <p className="text-xs text-[#7a96b8] mt-1">Total views</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/80 border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#3a5070] flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Shares
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#0d1e3a]">{summary?.totalShares || 0}</div>
              <p className="text-xs text-[#7a96b8] mt-1">Total shares</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/80 border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#3a5070] flex items-center gap-2">
                <Download className="w-4 h-4" />
                QR Scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#0d1e3a]">{summary?.totalQrScans || 0}</div>
              <p className="text-xs text-[#7a96b8] mt-1">Total scans</p>
            </CardContent>
          </Card>
        </div>

        {/* Card Selection and Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card List */}
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 lg:col-span-1">
            <CardHeader>
              <CardTitle>Your Cards</CardTitle>
              <CardDescription>Select a card to view detailed analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cardStats && cardStats.length > 0 ? (
                  cardStats.map((stat) => (
                    <Button
                      key={stat.cardId}
                      variant={selectedCardId === stat.cardId ? "default" : "outline"}
                      className="w-full justify-start text-left"
                      onClick={() => setSelectedCardId(stat.cardId)}
                    >
                      <div className="flex-1">
                        <div className="font-medium">Card {stat.cardId.slice(0, 8)}</div>
                        <div className="text-xs text-[#7a96b8]">
                          {stat.walletAddCount} wallet adds
                        </div>
                      </div>
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-[#7a96b8]">No cards yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analytics */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCardId && (
              <>
                {/* Event Type Distribution */}
                {!countsLoading && eventTypeData.length > 0 && (
                  <Card className="backdrop-blur-xl bg-white/80 border-white/20">
                    <CardHeader>
                      <CardTitle>Event Distribution</CardTitle>
                      <CardDescription>Breakdown of all interactions for this card</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={eventTypeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {eventTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Event Timeline */}
                {!eventsLoading && aggregatedTimeline.length > 0 && (
                  <Card className="backdrop-blur-xl bg-white/80 border-white/20">
                    <CardHeader>
                      <CardTitle>Activity Timeline</CardTitle>
                      <CardDescription>Recent interactions over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={aggregatedTimeline}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="wallet_add_apple" stackId="a" fill="#3b82f6" />
                          <Bar dataKey="wallet_add_google" stackId="a" fill="#ef4444" />
                          <Bar dataKey="qr_scan" stackId="a" fill="#10b981" />
                          <Bar dataKey="card_view" stackId="a" fill="#f59e0b" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Events */}
                {!eventsLoading && cardEvents && cardEvents.length > 0 && (
                  <Card className="backdrop-blur-xl bg-white/80 border-white/20">
                    <CardHeader>
                      <CardTitle>Recent Events</CardTitle>
                      <CardDescription>Last 10 interactions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {cardEvents.slice(0, 10).map((event) => (
                          <div key={event.id} className="flex items-center justify-between py-2 border-b border-[#dce6f5] last:border-0">
                            <div>
                              <p className="font-medium text-sm">{event.eventType.replace(/_/g, " ").toUpperCase()}</p>
                              <p className="text-xs text-[#7a96b8]">
                                {new Date(event.createdAt).toLocaleString()}
                              </p>
                            </div>
                            {event.platform && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {event.platform}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {!selectedCardId && (
              <Card className="backdrop-blur-xl bg-white/80 border-white/20">
                <CardHeader>
                  <CardTitle>Select a Card</CardTitle>
                  <CardDescription>Choose a card from the list to view detailed analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-64 text-[#7a96b8]">
                    <BarChart3 className="w-12 h-12 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Comparison Analytics Section */}
        {showComparison && cardStats && cardStats.length > 1 && (
          <div className="mt-8">
            <ComparisonAnalytics
              cardStats={cardStats}
              onClose={() => setShowComparison(false)}
            />
          </div>
        )}
      </div>

      {/* Notification Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={showNotificationPrefs}
        onClose={() => setShowNotificationPrefs(false)}
      />
    </div>
  );
}

function getColorForEventType(eventType: string): string {
  const colors: Record<string, string> = {
    wallet_add_apple: "#3b82f6",
    wallet_add_google: "#ef4444",
    qr_scan: "#10b981",
    card_view: "#f59e0b",
    card_share: "#8b5cf6",
    vcard_download: "#06b6d4",
    qr_download: "#ec4899",
  };
  return colors[eventType] || "#6b7280";
}
