import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Mail, RotateCcw, CheckCircle, AlertCircle, Clock, Eye, MousePointerClick } from "lucide-react";
import { trpc } from "@/lib/trpc";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  sent: "#10b981",
  failed: "#ef4444",
  bounced: "#8b5cf6",
  opened: "#3b82f6",
  clicked: "#06b6d4",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  sent: <CheckCircle className="w-4 h-4" />,
  failed: <AlertCircle className="w-4 h-4" />,
  bounced: <AlertCircle className="w-4 h-4" />,
  opened: <Eye className="w-4 h-4" />,
  clicked: <MousePointerClick className="w-4 h-4" />,
};

export default function EmailDelivery() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [deliveryLogs, setDeliveryLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Mock data for demonstration
  useEffect(() => {
    // In a real app, fetch from tRPC
    const mockLogs = [
      {
        id: 1,
        recipientEmail: "john@example.com",
        subject: "Follow-up: Great meeting!",
        status: "sent",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        openedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        id: 2,
        recipientEmail: "jane@example.com",
        subject: "Quick question about the proposal",
        status: "opened",
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        openedAt: null,
      },
      {
        id: 3,
        recipientEmail: "bob@example.com",
        subject: "Let's schedule a call",
        status: "failed",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        errorMessage: "Invalid email address",
      },
    ];

    setDeliveryLogs(mockLogs);

    const mockStats = {
      total: 45,
      sent: 38,
      opened: 22,
      clicked: 8,
      failed: 3,
      bounced: 2,
      pending: 2,
      successRate: "84.44",
      openRate: "57.89",
    };

    setStats(mockStats);
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "sent":
        return "default";
      case "opened":
        return "secondary";
      case "clicked":
        return "outline";
      case "failed":
        return "destructive";
      case "bounced":
        return "secondary";
      default:
        return "outline";
    }
  };

  const chartData = [
    { name: "Sent", value: stats?.sent || 0 },
    { name: "Opened", value: stats?.opened || 0 },
    { name: "Clicked", value: stats?.clicked || 0 },
    { name: "Failed", value: stats?.failed || 0 },
  ];

  const timelineData = [
    { time: "12:00", sent: 8, opened: 5, clicked: 2 },
    { time: "13:00", sent: 12, opened: 7, clicked: 3 },
    { time: "14:00", sent: 10, opened: 6, clicked: 2 },
    { time: "15:00", sent: 8, opened: 4, clicked: 1 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Email Delivery Dashboard</h1>
          </div>
          <p className="text-gray-600">Track and manage your email campaigns in real-time</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats?.sent || 0}</div>
              <p className="text-xs text-gray-500 mt-1">of {stats?.total || 0} emails</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Opened</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats?.opened || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Open rate: {stats?.openRate}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Clicked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-600">{stats?.clicked || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Click rate: {((stats?.clicked || 0) / (stats?.opened || 1) * 100).toFixed(1)}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats?.failed || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Retry available</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="logs">Delivery Logs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Status Distribution</CardTitle>
                  <CardDescription>Email delivery status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name.toLowerCase()] || "#8884d8"} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Last 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {deliveryLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{log.recipientEmail}</p>
                          <p className="text-xs text-gray-500 truncate">{log.subject}</p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(log.status)}>
                          <span className="flex items-center gap-1">
                            {STATUS_ICONS[log.status]}
                            {log.status}
                          </span>
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Logs</CardTitle>
                <CardDescription>Complete history of sent emails</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Recipient</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Subject</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Sent</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveryLogs.map((log) => (
                        <tr key={log.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-900">{log.recipientEmail}</td>
                          <td className="py-3 px-4 text-gray-600 truncate">{log.subject}</td>
                          <td className="py-3 px-4">
                            <Badge variant={getStatusBadgeVariant(log.status)}>
                              {log.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-500">
                            {log.createdAt.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            {log.status === "failed" && (
                              <Button variant="outline" size="sm" className="gap-1">
                                <RotateCcw className="w-3 h-3" />
                                Retry
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Timeline</CardTitle>
                <CardDescription>Email activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sent" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="opened" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="clicked" stroke="#06b6d4" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
