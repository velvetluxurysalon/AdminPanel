import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  DailyMetrics,
  PaymentModeSplit,
  ServiceAnalytics,
  CustomerAnalytics,
} from "../services/analyticsService";

/**
 * ADVANCED EXPORT UTILITIES
 * Generate professional PDF and Excel reports with detailed analytics
 * Includes payment mode separation, daily/monthly comparisons, and visual formatting
 */

interface ReportConfig {
  title: string;
  subtitle?: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  generatedAt: Date;
  includePaymentBreakdown?: boolean;
  companyName?: string;
  companyPhone?: string;
  companyEmail?: string;
}

// ==================== PDF EXPORTS ====================

export const exportDailyReportPDF = (
  metrics: DailyMetrics,
  paymentSplit: PaymentModeSplit,
  config: ReportConfig,
) => {
  const pdf = new jsPDF();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 12;
  let yPosition = margin;

  // Header
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text("DAILY SALES REPORT", margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    `Date: ${metrics.date.toLocaleDateString("en-IN")}`,
    margin,
    yPosition,
  );
  yPosition += 6;
  pdf.text(
    `Generated: ${config.generatedAt.toLocaleString("en-IN")}`,
    margin,
    yPosition,
  );
  yPosition += 10;

  // Main Metrics Section
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("FINANCIAL SUMMARY", margin, yPosition);
  yPosition += 8;

  const metricsData = [
    ["Metric", "Value"],
    ["Total Revenue", `Rs. ${metrics.totalRevenue.toFixed(2)}`],
    ["Total Transactions", metrics.totalTransactions.toString()],
    [
      "Average Transaction Value",
      `Rs. ${metrics.averageTransaction.toFixed(2)}`,
    ],
    ["Completed Visits", metrics.completedVisits.toString()],
  ];

  autoTable(pdf, {
    head: [metricsData[0]],
    body: metricsData.slice(1),
    startY: yPosition,
    margin: margin,
    theme: "grid",
    headStyles: {
      fillColor: [66, 103, 178],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 10;

  // Payment Mode Breakdown
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("PAYMENT MODE BREAKDOWN", margin, yPosition);
  yPosition += 8;

  const paymentData = [
    ["Payment Mode", "Amount", "Transactions", "Percentage"],
    [
      "Cash",
      `Rs. ${paymentSplit.cash.amount.toFixed(2)}`,
      paymentSplit.cash.count.toString(),
      `${paymentSplit.cash.percentage.toFixed(1)}%`,
    ],
    [
      "Card",
      `Rs. ${paymentSplit.card.amount.toFixed(2)}`,
      paymentSplit.card.count.toString(),
      `${paymentSplit.card.percentage.toFixed(1)}%`,
    ],
    [
      "UPI",
      `Rs. ${paymentSplit.upi.amount.toFixed(2)}`,
      paymentSplit.upi.count.toString(),
      `${paymentSplit.upi.percentage.toFixed(1)}%`,
    ],
    [
      "Wallet",
      `Rs. ${paymentSplit.wallet.amount.toFixed(2)}`,
      paymentSplit.wallet.count.toString(),
      `${paymentSplit.wallet.percentage.toFixed(1)}%`,
    ],
  ];

  autoTable(pdf, {
    head: [paymentData[0]],
    body: paymentData.slice(1),
    startY: yPosition,
    margin: margin,
    theme: "grid",
    headStyles: {
      fillColor: [76, 175, 80],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [245, 251, 246],
    },
  });

  // Add page numbers and footer
  const pageCount = (pdf as any).internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, {
      align: "center",
    });
  }

  return pdf;
};

export const exportMonthlyReportPDF = (
  dailyMetrics: DailyMetrics[],
  paymentSplit: PaymentModeSplit,
  serviceAnalytics: ServiceAnalytics[],
  config: ReportConfig,
) => {
  const pdf = new jsPDF();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 12;
  let yPosition = margin;

  // Header
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text("MONTHLY SALES REPORT", margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    `Period: ${config.dateRange.start.toLocaleDateString("en-IN")} - ${config.dateRange.end.toLocaleDateString("en-IN")}`,
    margin,
    yPosition,
  );
  yPosition += 6;
  pdf.text(
    `Generated: ${config.generatedAt.toLocaleString("en-IN")}`,
    margin,
    yPosition,
  );
  yPosition += 10;

  // Monthly Summary
  const totalRevenue = dailyMetrics.reduce((sum, m) => sum + m.totalRevenue, 0);
  const totalTransactions = dailyMetrics.reduce(
    (sum, m) => sum + m.totalTransactions,
    0,
  );
  const totalVisits = dailyMetrics.reduce(
    (sum, m) => sum + m.completedVisits,
    0,
  );
  const averageDaily = totalRevenue / dailyMetrics.length;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("MONTHLY SUMMARY", margin, yPosition);
  yPosition += 8;

  const summaryData = [
    ["Metric", "Value"],
    ["Total Monthly Revenue", `Rs. ${totalRevenue.toFixed(2)}`],
    ["Total Transactions", totalTransactions.toString()],
    ["Average Daily Revenue", `Rs. ${averageDaily.toFixed(2)}`],
    ["Total Completed Visits", totalVisits.toString()],
    [
      "Average Transaction Value",
      `Rs. ${(totalRevenue / totalTransactions).toFixed(2)}`,
    ],
  ];

  autoTable(pdf, {
    head: [summaryData[0]],
    body: summaryData.slice(1),
    startY: yPosition,
    margin: margin,
    theme: "grid",
    headStyles: {
      fillColor: [66, 103, 178],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 10;

  // Payment Mode Breakdown
  pdf.addPage();
  yPosition = margin;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("PAYMENT MODE ANALYSIS", margin, yPosition);
  yPosition += 10;

  const paymentData = [
    [
      "Payment Mode",
      "Total Amount",
      "Transactions",
      "Avg. Per Transaction",
      "% of Total",
    ],
    [
      "Cash",
      `Rs. ${paymentSplit.cash.amount.toFixed(2)}`,
      paymentSplit.cash.count.toString(),
      `Rs. ${(paymentSplit.cash.count > 0 ? paymentSplit.cash.amount / paymentSplit.cash.count : 0).toFixed(2)}`,
      `${paymentSplit.cash.percentage.toFixed(1)}%`,
    ],
    [
      "Card",
      `Rs. ${paymentSplit.card.amount.toFixed(2)}`,
      paymentSplit.card.count.toString(),
      `Rs. ${(paymentSplit.card.count > 0 ? paymentSplit.card.amount / paymentSplit.card.count : 0).toFixed(2)}`,
      `${paymentSplit.card.percentage.toFixed(1)}%`,
    ],
    [
      "UPI",
      `Rs. ${paymentSplit.upi.amount.toFixed(2)}`,
      paymentSplit.upi.count.toString(),
      `Rs. ${(paymentSplit.upi.count > 0 ? paymentSplit.upi.amount / paymentSplit.upi.count : 0).toFixed(2)}`,
      `${paymentSplit.upi.percentage.toFixed(1)}%`,
    ],
    [
      "Wallet",
      `Rs. ${paymentSplit.wallet.amount.toFixed(2)}`,
      paymentSplit.wallet.count.toString(),
      `Rs. ${(paymentSplit.wallet.count > 0 ? paymentSplit.wallet.amount / paymentSplit.wallet.count : 0).toFixed(2)}`,
      `${paymentSplit.wallet.percentage.toFixed(1)}%`,
    ],
  ];

  autoTable(pdf, {
    head: [paymentData[0]],
    body: paymentData.slice(1),
    startY: yPosition,
    margin: margin,
    theme: "grid",
    headStyles: {
      fillColor: [76, 175, 80],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [245, 251, 246],
    },
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 10;

  // Top Services
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("TOP SERVICES BY REVENUE", margin, yPosition);
  yPosition += 8;

  const topServicesData = [
    ["Service", "Revenue", "Transactions", "Avg. Price", "% of Total"],
    ...serviceAnalytics
      .slice(0, 10)
      .map((service) => [
        service.serviceName,
        `Rs. ${service.totalRevenue.toFixed(2)}`,
        service.transactionCount.toString(),
        `Rs. ${service.averagePrice.toFixed(2)}`,
        `${service.percentageOfTotal.toFixed(1)}%`,
      ]),
  ];

  autoTable(pdf, {
    head: [topServicesData[0]],
    body: topServicesData.slice(1),
    startY: yPosition,
    margin: margin,
    theme: "grid",
    headStyles: {
      fillColor: [156, 39, 176],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [248, 241, 251],
    },
  });

  // Footer with page numbers
  const pageCount = (pdf as any).internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, {
      align: "center",
    });
  }

  return pdf;
};

// ==================== EXCEL EXPORTS ====================

export const exportDailyReportExcel = (
  metrics: DailyMetrics,
  paymentSplit: PaymentModeSplit,
  config: ReportConfig,
  fileName: string = "daily_report.xlsx",
) => {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ["DAILY SALES REPORT"],
    ["Date:", metrics.date.toLocaleDateString("en-IN")],
    ["Generated:", config.generatedAt.toLocaleString("en-IN")],
    [],
    ["FINANCIAL SUMMARY"],
    ["Total Revenue", `Rs. ${metrics.totalRevenue.toFixed(2)}`],
    ["Total Transactions", metrics.totalTransactions],
    [
      "Average Transaction Value",
      `Rs. ${metrics.averageTransaction.toFixed(2)}`,
    ],
    ["Completed Visits", metrics.completedVisits],
    [
      "Average Visit Duration (mins)",
      `${metrics.averageVisitDuration.toFixed(2)}`,
    ],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // Payment Breakdown Sheet
  const paymentData = [
    ["PAYMENT MODE BREAKDOWN"],
    [],
    ["Payment Mode", "Amount (Rs.)", "Transactions", "Percentage"],
    [
      "Cash",
      paymentSplit.cash.amount,
      paymentSplit.cash.count,
      `${paymentSplit.cash.percentage.toFixed(1)}%`,
    ],
    [
      "Card",
      paymentSplit.card.amount,
      paymentSplit.card.count,
      `${paymentSplit.card.percentage.toFixed(1)}%`,
    ],
    [
      "UPI",
      paymentSplit.upi.amount,
      paymentSplit.upi.count,
      `${paymentSplit.upi.percentage.toFixed(1)}%`,
    ],
    [
      "Wallet",
      paymentSplit.wallet.amount,
      paymentSplit.wallet.count,
      `${paymentSplit.wallet.percentage.toFixed(1)}%`,
    ],
    ["TOTAL", paymentSplit.total, ""],
  ];

  const paymentSheet = XLSX.utils.aoa_to_sheet(paymentData);
  XLSX.utils.book_append_sheet(workbook, paymentSheet, "Payment Modes");

  // Save
  XLSX.writeFile(workbook, fileName);
};

export const exportMonthlyReportExcel = (
  dailyMetrics: DailyMetrics[],
  paymentSplit: PaymentModeSplit,
  serviceAnalytics: ServiceAnalytics[],
  customerAnalytics: CustomerAnalytics,
  config: ReportConfig,
  fileName: string = "monthly_report.xlsx",
) => {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const totalRevenue = dailyMetrics.reduce((sum, m) => sum + m.totalRevenue, 0);
  const totalTransactions = dailyMetrics.reduce(
    (sum, m) => sum + m.totalTransactions,
    0,
  );

  const summaryData = [
    ["MONTHLY SALES REPORT"],
    [
      "Period:",
      `${config.dateRange.start.toLocaleDateString("en-IN")} - ${config.dateRange.end.toLocaleDateString("en-IN")}`,
    ],
    ["Generated:", config.generatedAt.toLocaleString("en-IN")],
    [],
    ["MONTHLY SUMMARY"],
    ["Total Monthly Revenue", `Rs. ${totalRevenue.toFixed(2)}`],
    ["Total Transactions", totalTransactions],
    [
      "Average Daily Revenue",
      `Rs. ${(totalRevenue / dailyMetrics.length).toFixed(2)}`,
    ],
    [
      "Average Transaction Value",
      `Rs. ${(totalRevenue / totalTransactions).toFixed(2)}`,
    ],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // Daily Breakdown Sheet
  const dailyData = [
    [
      "Date",
      "Revenue (Rs.)",
      "Transactions",
      "Cash",
      "Card",
      "UPI",
      "Wallet",
      "Completed Visits",
    ],
    ...dailyMetrics.map((m) => [
      m.date.toLocaleDateString("en-IN"),
      `${m.totalRevenue.toFixed(2)}`,
      m.totalTransactions,
      `${m.cashRevenue.toFixed(2)}`,
      `${m.cardRevenue.toFixed(2)}`,
      `${m.upiRevenue.toFixed(2)}`,
      `${m.walletRevenue.toFixed(2)}`,
      m.completedVisits,
    ]),
  ];

  const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
  XLSX.utils.book_append_sheet(workbook, dailySheet, "Daily Breakdown");

  // Payment Modes Sheet
  const paymentData = [
    ["PAYMENT MODE BREAKDOWN"],
    [],
    [
      "Payment Mode",
      "Total Amount (Rs.)",
      "Transactions",
      "Average",
      "Percentage",
    ],
    [
      "Cash",
      `${paymentSplit.cash.amount.toFixed(2)}`,
      paymentSplit.cash.count,
      `${(paymentSplit.cash.amount / paymentSplit.cash.count).toFixed(2)}`,
      `${paymentSplit.cash.percentage.toFixed(1)}%`,
    ],
    [
      "Card",
      `${paymentSplit.card.amount.toFixed(2)}`,
      paymentSplit.card.count,
      `${(paymentSplit.card.amount / paymentSplit.card.count).toFixed(2)}`,
      `${paymentSplit.card.percentage.toFixed(1)}%`,
    ],
    [
      "UPI",
      `${paymentSplit.upi.amount.toFixed(2)}`,
      paymentSplit.upi.count,
      `${(paymentSplit.upi.amount / paymentSplit.upi.count).toFixed(2)}`,
      `${paymentSplit.upi.percentage.toFixed(1)}%`,
    ],
    [
      "Wallet",
      `${paymentSplit.wallet.amount.toFixed(2)}`,
      paymentSplit.wallet.count,
      `${(paymentSplit.wallet.amount / paymentSplit.wallet.count).toFixed(2)}`,
      `${paymentSplit.wallet.percentage.toFixed(1)}%`,
    ],
  ];

  const paymentSheet = XLSX.utils.aoa_to_sheet(paymentData);
  XLSX.utils.book_append_sheet(workbook, paymentSheet, "Payment Modes");

  // Services Sheet
  const servicesData = [
    ["Service", "Revenue (Rs.)", "Transactions", "Average Price", "% of Total"],
    ...serviceAnalytics
      .slice(0, 20)
      .map((service) => [
        service.serviceName,
        `${service.totalRevenue.toFixed(2)}`,
        service.transactionCount,
        `${service.averagePrice.toFixed(2)}`,
        `${service.percentageOfTotal.toFixed(1)}%`,
      ]),
  ];

  const servicesSheet = XLSX.utils.aoa_to_sheet(servicesData);
  XLSX.utils.book_append_sheet(workbook, servicesSheet, "Services");

  // Customer Analytics Sheet
  const customerData = [
    ["Customer Analytics"],
    [],
    ["Total Customers", customerAnalytics.totalCustomers],
    ["Customers in Period", customerAnalytics.newCustomers],
    ["Returning Customers", customerAnalytics.returningCustomers],
    [
      "Repeat Customer %",
      `${customerAnalytics.repeatCustomerPercentage.toFixed(1)}%`,
    ],
    [
      "Total Customer Spent",
      `Rs. ${customerAnalytics.totalCustomerSpent.toFixed(2)}`,
    ],
    [
      "Avg Customer Lifetime Value",
      `Rs. ${customerAnalytics.averageCustomerLifetimeValue.toFixed(2)}`,
    ],
    [],
    ["TOP CUSTOMERS"],
    ["Customer ID", "Name", "Total Spent (Rs.)", "Visit Count", "Last Visit"],
    ...customerAnalytics.topCustomers.map((c: any) => [
      c.customerId,
      c.name,
      `${c.totalSpent.toFixed(2)}`,
      `${c.visitCount.toString()}`,
      c.lastVisit.toLocaleDateString("en-IN"),
    ]),
  ];

  const customerSheet = XLSX.utils.aoa_to_sheet(customerData);
  XLSX.utils.book_append_sheet(workbook, customerSheet, "Customer Analytics");

  // Save
  XLSX.writeFile(workbook, fileName);
};

export const exportCashCheckoutsSeparatelyExcel = (
  dailyMetrics: DailyMetrics[],
  config: ReportConfig,
  fileName: string = "cash_checkouts_report.xlsx",
) => {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const totalCash = dailyMetrics.reduce((sum, m) => sum + m.cashRevenue, 0);
  const totalCashTransactions = dailyMetrics.reduce((sum, m) => {
    // Calculate based on rough estimation
    return (
      sum +
      Math.round((m.totalTransactions * m.cashRevenue) / m.totalRevenue || 0)
    );
  }, 0);

  const summaryData = [
    ["CASH CHECKOUTS REPORT"],
    [
      "Period:",
      `${config.dateRange.start.toLocaleDateString("en-IN")} - ${config.dateRange.end.toLocaleDateString("en-IN")}`,
    ],
    ["Generated:", config.generatedAt.toLocaleString("en-IN")],
    [],
    ["CASH SUMMARY"],
    ["Total Cash Revenue", `Rs. ${totalCash.toFixed(2)}`],
    ["Estimated Cash Transactions", totalCashTransactions],
    [
      "Average Cash Transaction",
      `Rs. ${(totalCash / totalCashTransactions).toFixed(2)}`,
    ],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Cash Summary");

  // Daily Cash Breakdown
  const dailyData = [
    ["Date", "Cash Revenue (Rs.)", "% of Daily Total", "Day", "Notes"],
    ...dailyMetrics.map((m) => [
      m.date.toLocaleDateString("en-IN"),
      `${m.cashRevenue.toFixed(2)}`,
      `${((m.cashRevenue / m.totalRevenue) * 100).toFixed(1)}%`,
      m.date.toLocaleDateString("en-IN", { weekday: "long" }),
      m.cashRevenue > 0 ? "✓ Recorded" : "No cash transactions",
    ]),
  ];

  const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
  XLSX.utils.book_append_sheet(workbook, dailySheet, "Daily Cash Breakdown");

  // Save
  XLSX.writeFile(workbook, fileName);
};
