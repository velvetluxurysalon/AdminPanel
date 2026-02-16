import { useState, useEffect } from 'react';
import {
  IndianRupee, Users, ShoppingBag, TrendingUp, Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  Clock, Activity, Award, Zap, Target, BarChart3, PieChart as PieIcon, TrendingDown, AlertCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  getDashboardStats, getStaff, getCustomers, getServices, getProducts, getVisits, getInvoices,
  getUpcomingAppointments, getActiveVisits, getTodayVisitsSummary
} from '../utils/firebaseUtils';

const Dashboard = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        dailySales: 0,
        monthlySales: 0,
        todayVisits: 0,
        totalInvoices: 0,
        topServices: [],
        topProducts: [],
        monthlyTrend: [],
        recentTransactions: [],
        activeVisits: 0,
        totalCustomers: 0,
        totalStaff: 0,
        upcomingAppointments: 0,
        totalServices: 0,
        totalProducts: 0,
        avgOrderValue: 0,
        conversionRate: 0,
        peakHour: '10:00 AM',
        peakService: 'N/A',
        uniqueCustomers: 0,
        returningCustomers: 0,
        hourlyData: [],
        staffAttendance: 0,
        totalRevenue: 0
    });

    useEffect(() => {
        fetchAllStats();
    }, [selectedDate]);

    const fetchAllStats = async () => {
        try {
            setLoading(true);
            setError('');

            const [
                dashboardData,
                staffList,
                customerList,
                servicesList,
                productsList,
                visitsList,
                invoicesList,
                upcomingAppts,
                activeVisitsList,
                todaySummary
            ] = await Promise.all([
                getDashboardStats(),
                getStaff(),
                getCustomers(false),
                getServices(false),
                getProducts(),
                getVisits(false),
                getInvoices(),
                getUpcomingAppointments(7),
                getActiveVisits(),
                getTodayVisitsSummary()
            ]);

            // Filter data for selected date
            const selectedDateStr = selectedDate.toDateString();
            const selectedDateVisits = visitsList?.filter(v => {
                const visitDate = new Date(v.date?.toDate?.() || v.date);
                return visitDate.toDateString() === selectedDateStr;
            }) || [];

            const selectedDateInvoices = invoicesList?.filter(inv => {
                const invDate = new Date(inv.invoiceDate?.toDate?.() || inv.invoiceDate);
                return invDate.toDateString() === selectedDateStr;
            }) || [];

            // Calculate daily sales for selected date
            const dailySalesSelected = selectedDateInvoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0) || 0;

            // Calculate monthly sales (entire month of selected date)
            const monthStr = selectedDate.getFullYear() + '-' + String(selectedDate.getMonth() + 1).padStart(2, '0');
            const monthlyInvoices = invoicesList?.filter(inv => {
                const date = inv.invoiceDate?.toDate?.() || new Date(inv.invoiceDate);
                const dateMonthStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
                return dateMonthStr === monthStr;
            }) || [];
            const monthlySales = monthlyInvoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0) || 0;

            // Calculate service analytics
            const serviceStats = {};
            const productStats = {};
            selectedDateVisits.forEach(visit => {
                visit.services?.forEach(service => {
                    const serviceName = service.name || 'Unknown Service';
                    serviceStats[serviceName] = (serviceStats[serviceName] || 0) + 1;
                });
                visit.products?.forEach(product => {
                    const productName = product.name || 'Unknown Product';
                    productStats[productName] = (productStats[productName] || 0) + 1;
                });
            });

            const topServices = Object.entries(serviceStats)
                .map(([name, count]) => ({ name, value: count }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);

            const topProducts = Object.entries(productStats)
                .map(([name, count]) => ({ name, value: count }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);

            // Calculate by-hour analytics for selected date
            const hourlyStats = {};
            selectedDateVisits.forEach(visit => {
                const hour = new Date(visit.date?.toDate?.() || visit.date).getHours();
                hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
            });
            const hourlyData = Array.from({ length: 24 }, (_, i) => ({
                hour: `${String(i).padStart(2, '0')}:00`,
                visits: hourlyStats[i] || 0,
                revenue: selectedDateVisits
                    .filter(v => new Date(v.date?.toDate?.() || v.date).getHours() === i)
                    .reduce((sum, v) => sum + (v.totalAmount || 0), 0)
            }));

            // Transactions for selected date
            const recentTransactions = selectedDateInvoices.map(inv => ({
                id: inv.id,
                customer: inv.customerName || 'Walk-in',
                amount: inv.finalAmount || 0,
                date: inv.invoiceDate?.toDate?.() || inv.invoiceDate,
                status: inv.status || 'pending',
                time: new Date(inv.invoiceDate?.toDate?.() || inv.invoiceDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            }));

            // Customer analytics
            const uniqueCustomersSelected = new Set(selectedDateVisits.map(v => v.customerId)).size;

            // Revenue distribution by hour
            const avgOrderValue = selectedDateInvoices.length > 0 ? dailySalesSelected / selectedDateInvoices.length : 0;

            // Peak service
            const peakService = topServices.length > 0 ? topServices[0].name : 'N/A';

            // Customer retention rate (returning customers)
            const customerVisitCount = {};
            visitsList?.forEach(v => {
                customerVisitCount[v.customerId] = (customerVisitCount[v.customerId] || 0) + 1;
            });
            const returningCustomers = Object.values(customerVisitCount).filter(count => count > 1).length;

            setStats({
                dailySales: dailySalesSelected,
                monthlySales: monthlySales,
                todayVisits: selectedDateVisits.length,
                totalInvoices: invoicesList?.length || 0,
                topServices: topServices,
                topProducts: topProducts,
                monthlyTrend: generateMonthlyTrend(monthlyInvoices),
                recentTransactions: recentTransactions,
                activeVisits: activeVisitsList?.length || 0,
                totalCustomers: customerList?.length || 0,
                totalStaff: staffList?.length || 0,
                upcomingAppointments: upcomingAppts?.length || 0,
                totalServices: servicesList?.length || 0,
                totalProducts: productsList?.length || 0,
                avgOrderValue: avgOrderValue,
                conversionRate: ((uniqueCustomersSelected / (customerList?.length || 1)) * 100).toFixed(1),
                peakHour: calculatePeakHour(selectedDateVisits),
                peakService: peakService,
                uniqueCustomers: uniqueCustomersSelected,
                returningCustomers: returningCustomers,
                hourlyData: hourlyData,
                staffAttendance: 0,
                totalRevenue: monthlySales
            });
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            setError('Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const generateMonthlyTrend = (invoices) => {
        const trend = {};
        invoices?.forEach(inv => {
            const date = inv.invoiceDate?.toDate?.() || new Date(inv.invoiceDate);
            const month = date.toLocaleString('default', { month: 'short' });
            trend[month] = (trend[month] || 0) + (inv.finalAmount || 0);
        });
        return Object.entries(trend).map(([name, revenue]) => ({
            name,
            revenue: parseFloat(revenue.toFixed(2))
        }));
    };

    const calculateConversionRate = (visits, totalCustomers) => {
        if (totalCustomers === 0) return 0;
        return ((visits / totalCustomers) * 100).toFixed(1);
    };

    const calculatePeakHour = (visits) => {
        const hourCounts = {};
        visits?.forEach(visit => {
            const date = visit.date?.toDate?.() || new Date(visit.date);
            const hour = date.getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        const peakHour = Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b, 0);
        return `${String(peakHour).padStart(2, '0')}:00`;
    };

    const StatCard = ({ title, value, icon: Icon, color = '#d4af37', subtitle = '' }) => (
        <div className="card" style={{
            background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
            borderLeft: `5px solid ${color}`,
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden'
        }} onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = `0 15px 40px ${color}30`;
        }} onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        }}>
            {/* Animated background gradient */}
            <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '200%',
                height: '200%',
                background: `radial-gradient(circle, ${color}10, transparent 70%)`,
                pointerEvents: 'none'
            }} />
            <div className="card-content" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                <div style={{ flex: 1 }}>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</p>
                    <h3 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--foreground)', lineHeight: 1, marginBottom: '0.25rem' }}>{value}</h3>
                    {subtitle && <p style={{ fontSize: '0.75rem', color: color, fontWeight: '600' }}>{subtitle}</p>}
                </div>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${color}30, ${color}10)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color,
                    flexShrink: 0,
                    border: `2px solid ${color}20`
                }}>
                    <Icon size={32} />
                </div>
            </div>
        </div>
    );

    const COLORS = ['#d4af37', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

    const Calendar = () => {
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} />);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();

            days.push(
                <div
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    style={{
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        background: isSelected ? 'linear-gradient(135deg, #d4af37, #b45309)' : isToday ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                        color: isSelected ? 'black' : 'var(--foreground)',
                        fontWeight: isSelected || isToday ? '700' : '500',
                        border: isToday && !isSelected ? '2px solid #d4af37' : 'none',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {i}
                </div>
            );
        }

        const nextMonth = () => {
            setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
        };

        const prevMonth = () => {
            setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
        };

        return (
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem' }}>
                    <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <span style={{ fontWeight: '700', fontSize: '1.1rem', textAlign: 'center', flex: 1 }}>
                        {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem' }}>
                        <ChevronRight size={20} />
                    </button>
                </div>
                <div className="card-content">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '1rem', fontWeight: '600' }}>
                        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem' }}>
                        {days}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted-foreground)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                    <p>Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Welcome Header */}
            <div style={{
                marginBottom: '2.5rem',
                padding: '2.5rem',
                borderRadius: 'var(--radius)',
                background: 'linear-gradient(135deg, #d4af37 0%, #b45309 100%)',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 15px 40px rgba(212, 175, 55, 0.25)'
            }}>
                <div>
                    <p style={{ fontSize: '1.125rem', opacity: 0.95, marginBottom: '0.5rem', fontWeight: '500' }}>Welcome to Velvet Luxury Salon</p>
                    <p style={{ fontSize: '0.875rem', opacity: 0.85 }}>Here's your real-time business intelligence dashboard</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2.75rem', fontWeight: '800', lineHeight: 1, marginBottom: '0.25rem' }}>{selectedDate.getDate()}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {selectedDate.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.85 }}>
                        {selectedDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                    </div>
                </div>
            </div>

            {error && (
                <div style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: '#ef4444'
                }}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Main Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <StatCard title="Daily Sales" value={`₹${stats.dailySales.toFixed(0)}`} icon={IndianRupee} color="#d4af37" />
                <StatCard title="Monthly Revenue" value={`₹${stats.monthlySales.toFixed(0)}`} icon={TrendingUp} color="#10b981" />
                <StatCard title="Today's Visits" value={stats.todayVisits} icon={Users} color="#3b82f6" />
                <StatCard title="Total Orders" value={stats.totalInvoices} icon={ShoppingBag} color="#f59e0b" />
            </div>

            {/* Secondary Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <StatCard title="Active Visits" value={stats.activeVisits} icon={Activity} color="#8b5cf6" />
                <StatCard title="Total Customers" value={stats.totalCustomers} icon={Users} color="#06b6d4" />
                <StatCard title="Upcoming Appointments" value={stats.upcomingAppointments} icon={Clock} color="#ec4899" />
                <StatCard title="Services Offered" value={stats.totalServices} icon={Zap} color="#f97316" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', marginBottom: '2.5rem', alignItems: 'start' }}>
                {/* Charts Container */}
                <div>
                    {/* Monthly Revenue Trend */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div className="card-header">
                            <h2 className="card-title">
                                <BarChart3 size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                Monthly Revenue Trend
                            </h2>
                        </div>
                        <div className="card-content" style={{ height: '280px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.monthlyTrend}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#d4af37" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                                    <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                                    <YAxis stroke="var(--muted-foreground)" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--glass-border)', color: 'var(--foreground)', borderRadius: 'var(--radius)' }}
                                        cursor={{ fill: 'rgba(212, 175, 55, 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#d4af37" fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Services and Products Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {/* Top Services */}
                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title">
                                    <Award size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                    Top 5 Services
                                </h2>
                            </div>
                            <div className="card-content">
                                {stats.topServices.length > 0 ? (
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {stats.topServices.slice(0, 5).map((service, idx) => (
                                            <li key={idx} style={{ padding: '0.75rem 0', borderBottom: idx < stats.topServices.length - 1 ? '1px solid var(--glass-border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.875rem' }}>{idx + 1}. {service.name}</span>
                                                <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{service.value}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p style={{ color: 'var(--muted-foreground)', textAlign: 'center' }}>No data available</p>
                                )}
                            </div>
                        </div>

                        {/* Top Products */}
                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title">
                                    <ShoppingBag size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                    Top 5 Products
                                </h2>
                            </div>
                            <div className="card-content">
                                {stats.topProducts.length > 0 ? (
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {stats.topProducts.slice(0, 5).map((product, idx) => (
                                            <li key={idx} style={{ padding: '0.75rem 0', borderBottom: idx < stats.topProducts.length - 1 ? '1px solid var(--glass-border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.875rem' }}>{idx + 1}. {product.name}</span>
                                                <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{product.value}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p style={{ color: 'var(--muted-foreground)', textAlign: 'center' }}>No data available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Calendar Sidebar */}
                <Calendar />
            </div>

            {/* Recent Transactions */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Latest Transactions - {selectedDate.toLocaleDateString()}</h2>
                </div>
                <div className="card-content" style={{ maxHeight: '400px', overflowY: 'auto', padding: 0 }}>
                    {stats.recentTransactions.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--muted-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>Bill ID</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--muted-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>Customer</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--muted-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>Time</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--muted-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>Amount</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentTransactions.map((transaction, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--primary)', fontWeight: '600' }}>#{transaction.id}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>{transaction.customer || 'Walk-in'}</div>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                                            {transaction.time || new Date(transaction.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '700', color: 'var(--primary)' }}>₹{(transaction.amount || 0).toFixed(2)}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '0.35rem 0.85rem',
                                                borderRadius: '999px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                backgroundColor: transaction.status === 'paid' || transaction.status === 'PAID' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 193, 7, 0.1)',
                                                color: transaction.status === 'paid' || transaction.status === 'PAID' ? '#10b981' : '#ffc107',
                                                border: `1px solid ${transaction.status === 'paid' || transaction.status === 'PAID' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 193, 7, 0.3)'}`
                                            }}>
                                                {transaction.status === 'paid' || transaction.status === 'PAID' ? 'Paid' : 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                            <p>No transactions for this date</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
