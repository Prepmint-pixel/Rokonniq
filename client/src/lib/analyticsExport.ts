/**
 * Analytics Export Utilities
 * Export analytics data as CSV or PDF reports
 */

interface CardStats {
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

interface AnalyticsEvent {
  id: number;
  eventType: string;
  createdAt: Date;
  platform?: string;
}

/**
 * Export card statistics as CSV
 */
export function exportCardStatsAsCSV(stats: CardStats[], filename: string = "card-analytics.csv"): void {
  const headers = [
    "Card ID",
    "Wallet Adds (Total)",
    "Apple Wallet",
    "Google Wallet",
    "QR Scans",
    "Card Views",
    "Shares",
    "vCard Downloads",
    "QR Downloads",
  ];

  const rows = stats.map((stat) => [
    stat.cardId,
    stat.walletAddCount,
    stat.walletAddAppleCount,
    stat.walletAddGoogleCount,
    stat.qrScanCount,
    stat.cardViewCount,
    stat.cardShareCount,
    stat.vcardDownloadCount,
    stat.qrDownloadCount,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  downloadFile(csvContent, filename, "text/csv");
}

/**
 * Export events as CSV
 */
export function exportEventsAsCSV(
  events: AnalyticsEvent[],
  filename: string = "card-events.csv"
): void {
  const headers = ["Event Type", "Date", "Platform"];

  const rows = events.map((event) => [
    event.eventType,
    new Date(event.createdAt).toLocaleString(),
    event.platform || "N/A",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  downloadFile(csvContent, filename, "text/csv");
}

/**
 * Generate analytics summary report as text
 */
export function generateAnalyticsSummaryReport(
  stats: CardStats[],
  summary: {
    totalWalletAdds: number;
    totalQrScans: number;
    totalCardViews: number;
    totalShares: number;
  }
): string {
  const date = new Date().toLocaleString();
  const lines = [
    "=".repeat(60),
    "ROKONNIQ - ANALYTICS REPORT",
    "=".repeat(60),
    `Generated: ${date}`,
    "",
    "SUMMARY STATISTICS",
    "-".repeat(60),
    `Total Wallet Additions: ${summary.totalWalletAdds}`,
    `Total QR Code Scans: ${summary.totalQrScans}`,
    `Total Card Views: ${summary.totalCardViews}`,
    `Total Shares: ${summary.totalShares}`,
    "",
    "CARD PERFORMANCE",
    "-".repeat(60),
  ];

  stats.forEach((stat, index) => {
    lines.push(`\nCard ${index + 1}: ${stat.cardId.slice(0, 8)}`);
    lines.push(`  Wallet Adds: ${stat.walletAddCount} (Apple: ${stat.walletAddAppleCount}, Google: ${stat.walletAddGoogleCount})`);
    lines.push(`  QR Scans: ${stat.qrScanCount}`);
    lines.push(`  Card Views: ${stat.cardViewCount}`);
    lines.push(`  Shares: ${stat.cardShareCount}`);
    lines.push(`  Downloads: vCard (${stat.vcardDownloadCount}), QR (${stat.qrDownloadCount})`);
  });

  lines.push("\n" + "=".repeat(60));
  lines.push("END OF REPORT");
  lines.push("=".repeat(60));

  return lines.join("\n");
}

/**
 * Export summary report as text file
 */
export function exportSummaryReportAsText(
  stats: CardStats[],
  summary: {
    totalWalletAdds: number;
    totalQrScans: number;
    totalCardViews: number;
    totalShares: number;
  },
  filename: string = "analytics-report.txt"
): void {
  const reportContent = generateAnalyticsSummaryReport(stats, summary);
  downloadFile(reportContent, filename, "text/plain");
}

/**
 * Helper function to download file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const element = document.createElement("a");
  element.setAttribute("href", `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`);
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/**
 * Copy analytics data to clipboard
 */
export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => false);
}
