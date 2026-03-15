import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";

export interface DailyMetrics {
  date: Date;
  totalRevenue: number;
  cashRevenue: number;
  cardRevenue: number;
  upiRevenue: number;
  walletRevenue: number;
  totalTransactions: number;
  totalInvoices: number;
  completedVisits: number;
  averageTransaction: number;
  averageVisitDuration: number;
}

export interface PaymentModeSplit {
  cash: { amount: number; count: number; percentage: number };
  card: { amount: number; count: number; percentage: number };
  upi: { amount: number; count: number; percentage: number };
  wallet: { amount: number; count: number; percentage: number };
  total: number;
}

export interface ServiceAnalytics {
  serviceId: string;
  serviceName: string;
  totalRevenue: number;
  transactionCount: number;
  averagePrice: number;
  percentageOfTotal: number;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  repeatCustomerPercentage: number;
  totalCustomerSpent: number;
  averageCustomerLifetimeValue: number;
  topCustomers: Array<{
    customerId: string;
    name: string;
    totalSpent: number;
    visitCount: number;
    lastVisit: Date;
  }>;
}

export interface StaffPerformance {
  staffId: string;
  staffName: string;
  totalServices: number;
  totalRevenue: number;
  averageServiceValue: number;
  customerRating: number;
  completionRate: number;
}

export interface TimeslotAnalytics {
  hour: number;
  timeRange: string;
  revenue: number;
  transactionCount: number;
  averageTransaction: number;
  peakRating: "Low" | "Medium" | "High" | "Peak";
}

/**
 * ANALYTICS SERVICE - Comprehensive financial & operational metrics
 * Handles daily/monthly reporting with payment mode separation
 */

export const getDailyMetrics = async (date: Date): Promise<DailyMetrics> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    // Fetch all visits for the day from the visits collection
    const visitsQuery = query(
      collection(db, "visits"),
      where("date", ">=", Timestamp.fromDate(startOfDay)),
      where("date", "<=", Timestamp.fromDate(endOfDay)),
    );

    const visitsSnap = await getDocs(visitsQuery);
    const visits = visitsSnap.docs.map((doc) => doc.data() as any);

    // Calculate revenue metrics from visits
    const paymentModes = {
      cash: 0,
      card: 0,
      upi: 0,
      wallet: 0,
    };

    let totalRevenue = 0;
    let completedVisitCount = 0;
    const completedVisits = visits.filter((v: any) => v.status === "COMPLETED");

    visits.forEach((visit: any) => {
      const paidAmount = visit.paidAmount || visit.totalAmount || 0;
      totalRevenue += paidAmount;

      const mode = visit.paymentMode?.toLowerCase() || "cash";
      if (paymentModes[mode as keyof typeof paymentModes] !== undefined) {
        paymentModes[mode as keyof typeof paymentModes] += paidAmount;
      }
    });

    completedVisitCount = completedVisits.length;

    const totalVisitDuration = visits.reduce(
      (sum: number, v: any) =>
        sum +
        (v.items?.reduce(
          (s: number, item: any) => s + (item.duration || 0),
          0,
        ) || 0),
      0,
    );

    return {
      date,
      totalRevenue,
      cashRevenue: paymentModes.cash,
      cardRevenue: paymentModes.card,
      upiRevenue: paymentModes.upi,
      walletRevenue: paymentModes.wallet,
      totalTransactions: visits.length,
      totalInvoices: visits.length,
      completedVisits: completedVisitCount,
      averageTransaction: visits.length > 0 ? totalRevenue / visits.length : 0,
      averageVisitDuration:
        visits.length > 0 ? totalVisitDuration / visits.length : 0,
    };
  } catch (error) {
    console.error("Error fetching daily metrics:", error);
    throw error;
  }
};

export const getMonthlyMetrics = async (
  year: number,
  month: number,
): Promise<DailyMetrics[]> => {
  const endDate = new Date(year, month, 0);

  const dailyMetrics: DailyMetrics[] = [];

  for (let day = 1; day <= endDate.getDate(); day++) {
    const date = new Date(year, month - 1, day);
    const metrics = await getDailyMetrics(date);
    dailyMetrics.push(metrics);
  }

  return dailyMetrics;
};

export const getPaymentModeSplit = async (
  startDate: Date,
  endDate: Date,
): Promise<PaymentModeSplit> => {
  try {
    // Ensure proper time ranges for daily/monthly queries
    const queryStartDate = new Date(startDate);
    queryStartDate.setHours(0, 0, 0, 0);

    const queryEndDate = new Date(endDate);
    queryEndDate.setHours(23, 59, 59, 999);

    const visitsQuery = query(
      collection(db, "visits"),
      where("date", ">=", Timestamp.fromDate(queryStartDate)),
      where("date", "<=", Timestamp.fromDate(queryEndDate)),
    );

    const visitsSnap = await getDocs(visitsQuery);
    const visits = visitsSnap.docs.map((doc) => doc.data() as any);

    const split: PaymentModeSplit = {
      cash: { amount: 0, count: 0, percentage: 0 },
      card: { amount: 0, count: 0, percentage: 0 },
      upi: { amount: 0, count: 0, percentage: 0 },
      wallet: { amount: 0, count: 0, percentage: 0 },
      total: 0,
    };

    visits.forEach((visit: any) => {
      const mode = (visit.paymentMode?.toLowerCase() || "cash") as keyof Omit<
        PaymentModeSplit,
        "total"
      >;
      const amount = visit.paidAmount || visit.totalAmount || 0;

      if (split[mode]) {
        split[mode].amount += amount;
        split[mode].count++;
      }
      split.total += amount;
    });

    // Calculate percentages
    Object.keys(split).forEach((mode) => {
      if (mode !== "total" && split.total > 0) {
        split[mode as keyof Omit<PaymentModeSplit, "total">].percentage =
          (split[mode as keyof Omit<PaymentModeSplit, "total">].amount /
            split.total) *
          100;
      }
    });

    return split;
  } catch (error) {
    console.error("Error fetching payment mode split:", error);
    throw error;
  }
};

export const getServiceAnalytics = async (
  startDate: Date,
  endDate: Date,
  limit_count: number = 10,
): Promise<ServiceAnalytics[]> => {
  try {
    const visitsQuery = query(
      collection(db, "visits"),
      where("date", ">=", Timestamp.fromDate(startDate)),
      where("date", "<=", Timestamp.fromDate(endDate)),
    );

    const visitsSnap = await getDocs(visitsQuery);
    const visits = visitsSnap.docs.map((doc) => doc.data() as any);

    const serviceMap = new Map<string, ServiceAnalytics>();

    visits.forEach((visit: any) => {
      (visit.items || []).forEach((item: any) => {
        if (item.type === "service") {
          const key = item.serviceId || item.name;
          const current = serviceMap.get(key) || {
            serviceId: item.serviceId || item.name,
            serviceName: item.name,
            totalRevenue: 0,
            transactionCount: 0,
            averagePrice: 0,
            percentageOfTotal: 0,
          };

          current.totalRevenue += item.price * item.quantity;
          current.transactionCount++;
          serviceMap.set(key, current);
        }
      });
    });

    let totalRevenue = 0;
    const services = Array.from(serviceMap.values());
    services.forEach((s) => {
      totalRevenue += s.totalRevenue;
      s.averagePrice =
        s.transactionCount > 0 ? s.totalRevenue / s.transactionCount : 0;
    });

    const sorted = services
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit_count);

    sorted.forEach((s) => {
      s.percentageOfTotal =
        totalRevenue > 0 ? (s.totalRevenue / totalRevenue) * 100 : 0;
    });

    return sorted;
  } catch (error) {
    console.error("Error fetching service analytics:", error);
    throw error;
  }
};

export const getCustomerAnalytics = async (
  startDate: Date,
  endDate: Date,
): Promise<CustomerAnalytics> => {
  try {
    const visitsQuery = query(
      collection(db, "visits"),
      where("date", ">=", Timestamp.fromDate(startDate)),
      where("date", "<=", Timestamp.fromDate(endDate)),
    );

    const visitsSnap = await getDocs(visitsQuery);
    const visits = visitsSnap.docs.map((doc) => doc.data() as any);

    // All customers collection
    const customersSnap = await getDocs(collection(db, "customers"));
    const allCustomers = customersSnap.docs.length;

    const customerMap = new Map<
      string,
      { name: string; spent: number; visits: number; lastVisit: Date }
    >();

    visits.forEach((visit: any) => {
      const customerId = visit.customerId;
      const current = customerMap.get(customerId) || {
        name: visit.customer?.name || "Unknown",
        spent: 0,
        visits: 0,
        lastVisit: new Date(startDate),
      };

      current.spent += visit.paidAmount || visit.totalAmount || 0;
      current.visits++;
      current.lastVisit = new Date(visit.date?.toDate?.() || new Date());

      customerMap.set(customerId, current);
    });

    const uniqueCustomersInPeriod = customerMap.size;
    let totalCustomerSpent = 0;
    const topCustomersList = Array.from(customerMap.entries())
      .map(([id, data]) => {
        totalCustomerSpent += data.spent;
        return {
          customerId: id,
          name: data.name,
          totalSpent: data.spent,
          visitCount: data.visits,
          lastVisit: data.lastVisit,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      totalCustomers: allCustomers,
      newCustomers: uniqueCustomersInPeriod,
      returningCustomers: Math.max(0, uniqueCustomersInPeriod - 1),
      repeatCustomerPercentage:
        uniqueCustomersInPeriod > 0
          ? (Math.max(0, uniqueCustomersInPeriod - 1) /
              uniqueCustomersInPeriod) *
            100
          : 0,
      totalCustomerSpent,
      averageCustomerLifetimeValue:
        allCustomers > 0 ? totalCustomerSpent / allCustomers : 0,
      topCustomers: topCustomersList,
    };
  } catch (error) {
    console.error("Error fetching customer analytics:", error);
    throw error;
  }
};

export const getStaffPerformance = async (
  startDate: Date,
  endDate: Date,
): Promise<StaffPerformance[]> => {
  try {
    const visitsQuery = query(
      collection(db, "visits"),
      where("date", ">=", Timestamp.fromDate(startDate)),
      where("date", "<=", Timestamp.fromDate(endDate)),
    );

    const visitsSnap = await getDocs(visitsQuery);
    const visits = visitsSnap.docs.map((doc) => doc.data() as any);

    const staffMap = new Map<string, StaffPerformance>();

    visits.forEach((visit: any) => {
      (visit.items || []).forEach((item: any) => {
        if (item.staff) {
          const staffId = item.staff.id || item.staff;
          const current = staffMap.get(staffId) || {
            staffId,
            staffName: item.staff.name || item.staff,
            totalServices: 0,
            totalRevenue: 0,
            averageServiceValue: 0,
            customerRating: 0,
            completionRate: 0,
          };

          current.totalServices++;
          current.totalRevenue += item.price * item.quantity;
          staffMap.set(staffId, current);
        }
      });
    });

    const staff = Array.from(staffMap.values());
    staff.forEach((s) => {
      s.averageServiceValue =
        s.totalServices > 0 ? s.totalRevenue / s.totalServices : 0;
      s.completionRate = 100; // Can be enhanced with feedback data
    });

    return staff.sort((a, b) => b.totalRevenue - a.totalRevenue);
  } catch (error) {
    console.error("Error fetching staff performance:", error);
    throw error;
  }
};

export const getHourlyAnalytics = async (
  date: Date,
): Promise<TimeslotAnalytics[]> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const visitsQuery = query(
      collection(db, "visits"),
      where("date", ">=", Timestamp.fromDate(startOfDay)),
      where("date", "<=", Timestamp.fromDate(endOfDay)),
    );

    const visitsSnap = await getDocs(visitsQuery);
    const visits = visitsSnap.docs.map((doc) => doc.data() as any);

    const hourlyData = new Map<number, TimeslotAnalytics>();

    // Initialize all hours
    for (let hour = 0; hour < 24; hour++) {
      hourlyData.set(hour, {
        hour,
        timeRange: `${hour.toString().padStart(2, "0")}:00 - ${(hour + 1).toString().padStart(2, "0")}:00`,
        revenue: 0,
        transactionCount: 0,
        averageTransaction: 0,
        peakRating: "Low",
      });
    }

    // Populate with actual data
    visits.forEach((visit: any) => {
      const visitDate = visit.date?.toDate?.() || new Date();
      const hour = visitDate.getHours();
      const data = hourlyData.get(hour)!;

      data.revenue += visit.paidAmount || visit.totalAmount || 0;
      data.transactionCount++;
    });

    // Calculate averages and peak ratings
    let maxRevenue = 0;
    hourlyData.forEach((data) => {
      if (data.transactionCount > 0) {
        data.averageTransaction = data.revenue / data.transactionCount;
      }
      maxRevenue = Math.max(maxRevenue, data.revenue);
    });

    hourlyData.forEach((data) => {
      if (data.revenue === 0) {
        data.peakRating = "Low";
      } else if (data.revenue >= maxRevenue * 0.75) {
        data.peakRating = "Peak";
      } else if (data.revenue >= maxRevenue * 0.5) {
        data.peakRating = "High";
      } else if (data.revenue >= maxRevenue * 0.25) {
        data.peakRating = "Medium";
      } else {
        data.peakRating = "Low";
      }
    });

    return Array.from(hourlyData.values());
  } catch (error) {
    console.error("Error fetching hourly analytics:", error);
    throw error;
  }
};

export const generateComparisonReport = async (
  period1Start: Date,
  period1End: Date,
  period2Start: Date,
  period2End: Date,
) => {
  try {
    const [period1, period2] = await Promise.all([
      getMonthlyMetrics(
        period1Start.getFullYear(),
        period1Start.getMonth() + 1,
      ),
      getMonthlyMetrics(
        period2Start.getFullYear(),
        period2Start.getMonth() + 1,
      ),
    ]);

    const period1Total = period1.reduce((sum, m) => sum + m.totalRevenue, 0);
    const period2Total = period2.reduce((sum, m) => sum + m.totalRevenue, 0);
    const growth = ((period2Total - period1Total) / period1Total) * 100;

    return {
      period1: {
        startDate: period1Start,
        endDate: period1End,
        totalRevenue: period1Total,
        averageDailyRevenue: period1Total / period1.length,
        totalTransactions: period1.reduce(
          (sum, m) => sum + m.totalTransactions,
          0,
        ),
      },
      period2: {
        startDate: period2Start,
        endDate: period2End,
        totalRevenue: period2Total,
        averageDailyRevenue: period2Total / period2.length,
        totalTransactions: period2.reduce(
          (sum, m) => sum + m.totalTransactions,
          0,
        ),
      },
      growth: {
        revenueGrowth: growth,
        percentageChange: `${growth > 0 ? "+" : ""}${growth.toFixed(2)}%`,
      },
    };
  } catch (error) {
    console.error("Error generating comparison report:", error);
    throw error;
  }
};
