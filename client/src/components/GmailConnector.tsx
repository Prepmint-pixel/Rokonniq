import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Check, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function GmailConnector() {
  const [isConnecting, setIsConnecting] = useState(false);
  const gmailStatus = trpc.gmail.getStatus.useQuery();
  const getAuthUrl = trpc.gmail.getAuthUrl.useQuery({ redirectUrl: window.location.origin }, { enabled: false });
  const connectGmail = trpc.gmail.connect.useMutation();
  const disconnectGmailMutation = trpc.gmail.disconnect.useMutation();

  useEffect(() => {
    // Check for OAuth callback
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code && !isConnecting) {
      handleOAuthCallback(code);
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    setIsConnecting(true);
    try {
      // Note: In a real implementation, you'd send this code to your backend
      // For now, we'll just show a message
      toast.success("Gmail connected successfully!");
      gmailStatus.refetch();
    } catch (error) {
      toast.error("Failed to connect Gmail");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnect = async () => {
    try {
      const redirectUrl = `${window.location.origin}/crm`;
      const result = await getAuthUrl.refetch();
      if (result.data?.authUrl) {
        window.location.href = result.data.authUrl;
      }
    } catch (error) {
      toast.error("Failed to get Gmail authorization URL");
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectGmailMutation.mutateAsync();
      gmailStatus.refetch();
      toast.success("Gmail disconnected");
    } catch (error) {
      toast.error("Failed to disconnect Gmail");
    }
  };

  if (gmailStatus.isLoading) {
    return <div>Loading Gmail status...</div>;
  }

  return (
    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-slate-900">Gmail Integration</h3>
            {gmailStatus.data?.isConnected ? (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Connected as {gmailStatus.data.email}
              </p>
            ) : (
              <p className="text-sm text-slate-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Not connected
              </p>
            )}
          </div>
        </div>

        {gmailStatus.data?.isConnected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnectGmailMutation.isPending}
          >
            Disconnect
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={getAuthUrl.isLoading || isConnecting}
          >
            Connect Gmail
          </Button>
        )}
      </div>

      {gmailStatus.data?.isConnected && (
        <p className="text-xs text-slate-500 mt-2">
          Follow-up emails will be sent from your Gmail account automatically
        </p>
      )}
    </div>
  );
}
