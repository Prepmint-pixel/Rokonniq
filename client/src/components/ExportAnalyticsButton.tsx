import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Sheet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  exportCardStatsAsCSV,
  exportEventsAsCSV,
  exportSummaryReportAsText,
} from "@/lib/analyticsExport";

interface ExportAnalyticsButtonProps {
  cardStats: any[];
  events: any[];
  summary: {
    totalWalletAdds: number;
    totalQrScans: number;
    totalCardViews: number;
    totalShares: number;
  };
}

export default function ExportAnalyticsButton({
  cardStats,
  events,
  summary,
}: ExportAnalyticsButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCardStats = () => {
    try {
      setIsExporting(true);
      const timestamp = new Date().toISOString().split("T")[0];
      exportCardStatsAsCSV(cardStats, `card-stats-${timestamp}.csv`);
      toast.success("Card statistics exported as CSV");
    } catch (error) {
      toast.error("Failed to export card statistics");
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportEvents = () => {
    try {
      setIsExporting(true);
      const timestamp = new Date().toISOString().split("T")[0];
      exportEventsAsCSV(events, `card-events-${timestamp}.csv`);
      toast.success("Events exported as CSV");
    } catch (error) {
      toast.error("Failed to export events");
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportReport = () => {
    try {
      setIsExporting(true);
      const timestamp = new Date().toISOString().split("T")[0];
      exportSummaryReportAsText(cardStats, summary, `analytics-report-${timestamp}.txt`);
      toast.success("Report exported as text file");
    } catch (error) {
      toast.error("Failed to export report");
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isExporting}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCardStats} disabled={isExporting || cardStats.length === 0}>
          <Sheet className="w-4 h-4 mr-2" />
          <span>Export Card Stats (CSV)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportEvents} disabled={isExporting || events.length === 0}>
          <Sheet className="w-4 h-4 mr-2" />
          <span>Export Events (CSV)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportReport} disabled={isExporting || cardStats.length === 0}>
          <FileText className="w-4 h-4 mr-2" />
          <span>Export Summary Report</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
