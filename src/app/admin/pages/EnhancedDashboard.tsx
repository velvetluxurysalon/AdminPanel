import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  getDailyMetrics,
  getMonthlyMetrics,
  getPaymentModeSplit,
  getServiceAnalytics,
  getCustomerAnalytics,
  getStaffPerformance,
  getHourlyAnalytics,
} from "../services/analyticsService";
import {
  exportDailyReportPDF,
  exportMonthlyReportPDF,
  exportMonthlyReportExcel,
  exportCashCheckoutsSeparatelyExcel,
} from "../utils/advancedExportUtils";

interface DashboardState {
  loading: boolean;
  error: string | null;
  selectedPeriod: "today" | "month" | "custom";
  selectedMonth: number;
  selectedYear: number;
  dailyMetrics: any;
  paymentSplit: any;
  serviceAnalytics: any[];
  customerAnalytics: any;
  staffPerformance: any[];
  hourlyAnalytics: any[];
}

const LegendaryEnhancedDashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    loading: true,
    error: null,
    selectedPeriod: "month",
    selectedMonth: new Date().getMonth() + 1,
    selectedYear: new Date().getFullYear(),
    dailyMetrics: null,
    paymentSplit: null,
    serviceAnalytics: [],
    customerAnalytics: null,
    staffPerformance: [],
    hourlyAnalytics: [],
  });

  const [exporting, setExporting] = useState(false);

  // Fetch all analytics data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const today = new Date();

        let dateRange = { start: today, end: today };

        if (state.selectedPeriod === "month") {
          dateRange = {
            start: new Date(state.selectedYear, state.selectedMonth - 1, 1),
            end: new Date(state.selectedYear, state.selectedMonth, 0),
          };
        }

        const [daily, paymentModes, services, customers, staff, hourly] =
          await Promise.all([
            getDailyMetrics(dateRange.start),
            getPaymentModeSplit(dateRange.start, dateRange.end),
            getServiceAnalytics(dateRange.start, dateRange.end, 10),
            getCustomerAnalytics(dateRange.start, dateRange.end),
            getStaffPerformance(dateRange.start, dateRange.end),
            getHourlyAnalytics(dateRange.start),
          ]);

        setState((prev) => ({
          ...prev,
          dailyMetrics: daily,
          paymentSplit: paymentModes,
          serviceAnalytics: services,
          customerAnalytics: customers,
          staffPerformance: staff,
          hourlyAnalytics: hourly,
          loading: false,
        }));
      } catch (error) {
        console.error("Error fetching analytics:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to load analytics data",
          loading: false,
        }));
      }
    };

    fetchData();
  }, [state.selectedPeriod, state.selectedMonth, state.selectedYear]);

  // Export handlers
  const handleExportDailyPDF = async () => {
    try {
      setExporting(true);
      if (!state.dailyMetrics || !state.paymentSplit) return;

      const pdf = exportDailyReportPDF(state.dailyMetrics, state.paymentSplit, {
        title: "Daily Sales Report",
        dateRange: {
          start: state.dailyMetrics.date,
          end: state.dailyMetrics.date,
        },
        generatedAt: new Date(),
      });

      pdf.save(
        `daily_report_${state.dailyMetrics.date.toISOString().split("T")[0]}.pdf`,
      );
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  const handleExportMonthlyPDF = async () => {
    try {
      setExporting(true);

      const startDate = new Date(
        state.selectedYear,
        state.selectedMonth - 1,
        1,
      );
      const endDate = new Date(state.selectedYear, state.selectedMonth, 0);
      const monthlyData = await getMonthlyMetrics(
        state.selectedYear,
        state.selectedMonth,
      );

      const pdf = exportMonthlyReportPDF(
        monthlyData,
        state.paymentSplit,
        state.serviceAnalytics,
        {
          title: "Monthly Sales Report",
          dateRange: { start: startDate, end: endDate },
          generatedAt: new Date(),
        },
      );

      pdf.save(
        `monthly_report_${state.selectedYear}-${String(state.selectedMonth).padStart(2, "0")}.pdf`,
      );
    } catch (error) {
      console.error("Error exporting monthly PDF:", error);
      alert("Failed to export monthly report");
    } finally {
      setExporting(false);
    }
  };

  const handleExportMonthlyExcel = async () => {
    try {
      setExporting(true);

      const startDate = new Date(
        state.selectedYear,
        state.selectedMonth - 1,
        1,
      );
      const endDate = new Date(state.selectedYear, state.selectedMonth, 0);
      const monthlyData = await getMonthlyMetrics(
        state.selectedYear,
        state.selectedMonth,
      );

      exportMonthlyReportExcel(
        monthlyData,
        state.paymentSplit,
        state.serviceAnalytics,
        state.customerAnalytics,
        {
          title: "Monthly Sales Report",
          dateRange: { start: startDate, end: endDate },
          generatedAt: new Date(),
        },
        `monthly_report_${state.selectedYear}-${String(state.selectedMonth).padStart(2, "0")}.xlsx`,
      );
    } catch (error) {
      console.error("Error exporting Excel:", error);
      alert("Failed to export Excel report");
    } finally {
      setExporting(false);
    }
  };

  const handleExportCashCheckouts = async () => {
    try {
      setExporting(true);

      const startDate = new Date(
        state.selectedYear,
        state.selectedMonth - 1,
        1,
      );
      const endDate = new Date(state.selectedYear, state.selectedMonth, 0);
      const monthlyData = await getMonthlyMetrics(
        state.selectedYear,
        state.selectedMonth,
      );

      exportCashCheckoutsSeparatelyExcel(
        monthlyData,
        {
          title: "Cash Checkouts Report",
          dateRange: { start: startDate, end: endDate },
          generatedAt: new Date(),
        },
        `cash_checkouts_${state.selectedYear}-${String(state.selectedMonth).padStart(2, "0")}.xlsx`,
      );
    } catch (error) {
      console.error("Error exporting cash checkouts:", error);
      alert("Failed to export cash checkouts");
    } finally {
      setExporting(false);
    }
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600"></div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50">
        <div className="text-red-600 text-xl font-semibold">{state.error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ANALYTICS DASHBOARD
          </h1>
          <p className="text-gray-600 text-lg">
            Velvet Luxury Salon - Comprehensive Financial Intelligence
          </p>
        </div>

        {/* Controls Bar */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 shadow border border-gray-200">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <select
                value={state.selectedMonth}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    selectedMonth: parseInt(e.target.value),
                  }))
                }
                className="bg-white text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2024, i, 1).toLocaleDateString("en-IN", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>

              <select
                value={state.selectedYear}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    selectedYear: parseInt(e.target.value),
                  }))
                }
                className="bg-white text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {[2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleExportDailyPDF}
                disabled={exporting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                Daily PDF
              </button>
              <button
                onClick={handleExportMonthlyPDF}
                disabled={exporting}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                Monthly PDF
              </button>
              <button
                onClick={handleExportMonthlyExcel}
                disabled={exporting}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                Full Excel
              </button>
              <button
                onClick={handleExportCashCheckouts}
                disabled={exporting}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                Cash Report
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards - Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <KPICard
            title="Total Revenue"
            value={`₹${state.dailyMetrics?.totalRevenue?.toFixed(2) || "0"}`}
            subtitle="Today's Total"
            color="from-green-500 to-emerald-600"
            icon=""
          />
          <KPICard
            title="Total Transactions"
            value={state.dailyMetrics?.totalTransactions?.toString() || "0"}
            subtitle="Invoices Created"
            color="from-blue-500 to-cyan-600"
            icon=""
          />
          <KPICard
            title="Completed Visits"
            value={state.dailyMetrics?.completedVisits?.toString() || "0"}
            subtitle="Finished Today"
            color="from-purple-500 to-indigo-600"
            icon=""
          />
          <KPICard
            title="Avg Transaction"
            value={`₹${state.dailyMetrics?.averageTransaction?.toFixed(0) || "0"}`}
            subtitle="Per Invoice"
            color="from-pink-500 to-rose-600"
            icon=""
          />
        </div>

        {/* Payment Mode Breakdown - Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Payment Pie Chart */}
          <div className="bg-white rounded-lg p-6 shadow border border-gray-200 col-span-1">
            <h3 className="text-gray-900 text-lg font-bold mb-4">
              💳 Payment Mode Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    {
                      name: "Cash",
                      value: state.paymentSplit?.cash?.amount || 0,
                    },
                    {
                      name: "Card",
                      value: state.paymentSplit?.card?.amount || 0,
                    },
                    {
                      name: "UPI",
                      value: state.paymentSplit?.upi?.amount || 0,
                    },
                    {
                      name: "Wallet",
                      value: state.paymentSplit?.wallet?.amount || 0,
                    },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) =>
                    value > 0 ? `${name}: ₹${value.toFixed(0)}` : ""
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6"].map(
                    (color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ),
                  )}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    `₹${typeof value === "number" ? value.toFixed(2) : value}`
                  }
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Breakdown Cards */}
          <div className="col-span-2 grid grid-cols-2 gap-4">
            <PaymentModeCard
              mode="Cash"
              amount={state.paymentSplit?.cash?.amount || 0}
              count={state.paymentSplit?.cash?.count || 0}
              percentage={state.paymentSplit?.cash?.percentage || 0}
              color="bg-green-600"
              icon="💵"
            />
            <PaymentModeCard
              mode="Card"
              amount={state.paymentSplit?.card?.amount || 0}
              count={state.paymentSplit?.card?.count || 0}
              percentage={state.paymentSplit?.card?.percentage || 0}
              color="bg-blue-600"
              icon="💳"
            />
            <PaymentModeCard
              mode="UPI"
              amount={state.paymentSplit?.upi?.amount || 0}
              count={state.paymentSplit?.upi?.count || 0}
              percentage={state.paymentSplit?.upi?.percentage || 0}
              color="bg-amber-600"
              icon="📱"
            />
            <PaymentModeCard
              mode="Wallet"
              amount={state.paymentSplit?.wallet?.amount || 0}
              count={state.paymentSplit?.wallet?.count || 0}
              percentage={state.paymentSplit?.wallet?.percentage || 0}
              color="bg-purple-600"
              icon="🔮"
            />
          </div>
        </div>

        {/* Top Services & Hourly Analysis - Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Services */}
          <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
            <h3 className="text-gray-900 text-lg font-bold mb-4">
              ⭐ Top 5 Services by Revenue
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={state.serviceAnalytics?.slice(0, 5) || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="serviceName"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tick={{ fill: "#6b7280" }} />
                <Tooltip
                  formatter={(value) =>
                    `₹${typeof value === "number" ? value.toFixed(2) : value}`
                  }
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="totalRevenue"
                  fill="#8B5CF6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Hourly Analytics */}
          <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
            <h3 className="text-gray-900 text-lg font-bold mb-4">
              ⏰ Hourly Revenue Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={state.hourlyAnalytics || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="timeRange"
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                />
                <YAxis tick={{ fill: "#6b7280" }} />
                <Tooltip
                  formatter={(value) =>
                    `₹${typeof value === "number" ? value.toFixed(2) : value}`
                  }
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  fill="#8B5CF6"
                  stroke="#A78BFA"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer & Staff Analytics - Row 4 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Customer Analytics */}
          <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
            <h3 className="text-gray-900 text-lg font-bold mb-4">
              👥 Customer Analytics
            </h3>
            <div className="space-y-3">
              <AnalyticRow
                label="Total Registered Customers"
                value={
                  state.customerAnalytics?.totalCustomers?.toString() || "0"
                }
              />
              <AnalyticRow
                label="New Customers This Month"
                value={state.customerAnalytics?.newCustomers?.toString() || "0"}
                highlighted
              />
              <AnalyticRow
                label="Repeat Customer %"
                value={`${state.customerAnalytics?.repeatCustomerPercentage?.toFixed(1)}%`}
              />
              <AnalyticRow
                label="Total Customer Spent"
                value={`₹${state.customerAnalytics?.totalCustomerSpent?.toFixed(2)}`}
                highlighted
              />
              <AnalyticRow
                label="Avg Customer Lifetime Value"
                value={`₹${state.customerAnalytics?.averageCustomerLifetimeValue?.toFixed(2)}`}
              />
            </div>

            <div className="mt-6 pt-6 border-t border-gray-300">
              <h4 className="text-purple-700 font-bold mb-3">Top Customers</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {state.customerAnalytics?.topCustomers
                  ?.slice(0, 5)
                  .map((customer: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200"
                    >
                      <span className="text-gray-800 text-sm">
                        {customer.name}
                      </span>
                      <span className="text-purple-700 font-semibold">
                        ₹{customer.totalSpent.toFixed(0)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Services Table */}
        <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
          <h3 className="text-gray-900 text-lg font-bold mb-4">
            Complete Service Analytics
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-300">
                  <th className="px-4 py-3 text-left text-purple-700 font-bold">
                    Service Name
                  </th>
                  <th className="px-4 py-3 text-right text-purple-700 font-bold">
                    Total Revenue
                  </th>
                  <th className="px-4 py-3 text-right text-purple-700 font-bold">
                    Transactions
                  </th>
                  <th className="px-4 py-3 text-right text-purple-700 font-bold">
                    Avg Price
                  </th>
                  <th className="px-4 py-3 text-right text-purple-700 font-bold">
                    % of Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {state.serviceAnalytics?.map((service: any, idx: number) => (
                  <tr
                    key={idx}
                    className={`border-b border-gray-200 ${
                      idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                    } hover:bg-gray-100 transition`}
                  >
                    <td className="px-4 py-3 text-gray-900">
                      {service.serviceName}
                    </td>
                    <td className="px-4 py-3 text-right text-green-700 font-semibold">
                      ₹{service.totalRevenue.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-700">
                      {service.transactionCount}
                    </td>
                    <td className="px-4 py-3 text-right text-purple-700">
                      ₹{service.averagePrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-700 font-bold">
                      {service.percentageOfTotal.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const KPICard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  color: string;
  icon: string;
}> = ({ title, value, subtitle, color, icon }) => (
  <div
    className={`bg-gradient-to-br ${color} rounded-lg p-6 shadow transform hover:scale-105 transition text-white`}
  >
    <div className="text-white text-4xl mb-2">{icon}</div>
    <p className="text-white text-sm opacity-90">{title}</p>
    <p className="text-white text-2xl font-bold">{value}</p>
    <p className="text-white text-xs opacity-75 mt-1">{subtitle}</p>
  </div>
);

const PaymentModeCard: React.FC<{
  mode: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
  icon: string;
}> = ({ mode, amount, count, percentage, color, icon }) => (
  <div
    className={`${color} rounded-lg p-4 shadow transform hover:scale-105 transition text-white`}
  >
    <div className="flex items-center justify-between mb-2">
      <span className="text-white font-bold">{mode}</span>
      <span className="text-white text-2xl">{icon}</span>
    </div>
    <p className="text-white text-xl font-bold">₹{amount.toFixed(0)}</p>
    <div className="flex justify-between text-white text-xs mt-2">
      <span>{count} transactions</span>
      <span>{percentage.toFixed(1)}%</span>
    </div>
  </div>
);

const AnalyticRow: React.FC<{
  label: string;
  value: string;
  highlighted?: boolean;
}> = ({ label, value, highlighted }) => (
  <div
    className={`flex justify-between items-center p-3 rounded border ${
      highlighted
        ? "bg-purple-50 border-purple-200"
        : "bg-gray-50 border-gray-200"
    }`}
  >
    <span
      className={
        highlighted ? "text-purple-700 font-semibold" : "text-gray-700"
      }
    >
      {label}
    </span>
    <span
      className={`font-bold ${highlighted ? "text-purple-700 text-lg" : "text-gray-900"}`}
    >
      {value}
    </span>
  </div>
);

export default LegendaryEnhancedDashboard;
