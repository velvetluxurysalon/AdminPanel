import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, Clock, Award, AlertCircle, Download, Filter, Search, BarChart3, PieChart, Zap, Users } from 'lucide-react';
import { getStaff, getStaffAttendance, getDocuments } from '../utils/firebaseUtils';

const StaffSalaryAnalytics = () => {
    const [staff, setStaff] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [monthYear, setMonthYear] = useState(new Date().toISOString().slice(0, 7));
    const [salaryData, setSalaryData] = useState(null);
    const [allStaffSalaries, setAllStaffSalaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState('detail'); // 'detail' or 'overview'
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchStaff();
    }, []);

    useEffect(() => {
        if (selectedStaff) {
            calculateSalaryData(selectedStaff);
        }
    }, [selectedStaff, monthYear]);

    useEffect(() => {
        if (staff.length > 0) {
            calculateAllStaffSalaries();
        }
    }, [monthYear, staff]);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const data = await getStaff(false);
            const staffWithSalary = data.map(s => ({
                ...s,
                hourlyRate: s.hourlyRate || 150,
                baseSalary: s.baseSalary || null,
                salaryType: s.salaryType || 'hourly', // 'hourly' or 'fixed'
                bonusPercentage: s.bonusPercentage || 5,
                position: s.role
            }));
            setStaff(staffWithSalary);
            if (staffWithSalary.length > 0) {
                setSelectedStaff(staffWithSalary[0]);
            }
        } catch (err) {
            console.error('Error fetching staff:', err);
            setError('Failed to load staff');
        } finally {
            setLoading(false);
        }
    };

    const calculateSalaryData = async (staffMember) => {
        try {
            setLoading(true);
            const records = await getStaffAttendance(staffMember.name, monthYear);
            
            // Calculate total hours
            let totalHours = 0;
            let workDays = 0;
            let presentDays = 0;
            let absentDays = 0;
            let halfDays = 0;
            const dailyHours = {};

            records.forEach(record => {
                // Use workHours directly if available (already calculated and stored)
                if (record.workHours) {
                    totalHours += parseFloat(record.workHours);
                    
                    if (record.status === 'present') {
                        presentDays++;
                        if (record.workHours < 4) {
                            halfDays++;
                        }
                    } else if (record.status === 'absent') {
                        absentDays++;
                    }
                    
                    workDays++;
                    const date = record.dateStr || new Date().toDateString();
                    dailyHours[date] = parseFloat(record.workHours);
                } else if (record.punchInTime && record.punchOutTime) {
                    // Fallback: Calculate from punch times if workHours not available
                    const punchIn = record.punchInTime && record.punchInTime.toDate 
                        ? record.punchInTime.toDate() 
                        : new Date(record.punchInTime);
                    const punchOut = record.punchOutTime && record.punchOutTime.toDate 
                        ? record.punchOutTime.toDate() 
                        : new Date(record.punchOutTime);
                    const hours = (punchOut - punchIn) / (1000 * 60 * 60);
                    totalHours += hours;
                    
                    if (record.status === 'present') {
                        presentDays++;
                        if (hours < 4) halfDays++;
                    }
                    workDays++;
                    
                    const date = punchIn.toDateString();
                    dailyHours[date] = hours;
                } else if (record.status === 'absent') {
                    absentDays++;
                }
            });

            // Calculate salary based on type
            let basePay = 0;
            let overtimePay = 0;
            let overtimeHours = 0;
            const standardHours = 8 * workDays; // 8 hours per working day

            if (staffMember.salaryType === 'hourly') {
                basePay = Math.min(totalHours, standardHours) * (staffMember.hourlyRate || 0);
                overtimeHours = Math.max(0, totalHours - standardHours);
                overtimePay = overtimeHours * ((staffMember.hourlyRate || 0) * 1.5); // 1.5x for overtime
            } else {
                basePay = staffMember.baseSalary || 0;
            }

            // Calculate bonus (5-10% of base pay for good attendance)
            const attendancePercentage = (workDays + absentDays > 0) ? (presentDays / (workDays + absentDays)) * 100 : 0;
            let bonusAmount = 0;
            if (attendancePercentage >= 95) {
                bonusAmount = basePay * ((staffMember.bonusPercentage || 0) / 100);
            }

            // Calculate deductions
            let deductions = 0;
            if (absentDays > 2) {
                deductions = (absentDays - 2) * (staffMember.hourlyRate || 0) * 8;
            }

            const totalPay = basePay + overtimePay + bonusAmount - deductions;
            const tax = totalPay * 0.05; // 5% tax
            const netPay = totalPay - tax;

            setSalaryData({
                staffMember,
                monthYear,
                workDays,
                presentDays,
                absentDays,
                halfDays,
                totalHours: parseFloat(totalHours.toFixed(2)),
                standardHours: parseFloat(standardHours.toFixed(2)),
                overtimeHours: parseFloat(overtimeHours.toFixed(2)),
                basePay: parseFloat(basePay.toFixed(2)),
                overtimePay: parseFloat(overtimePay.toFixed(2)),
                bonusAmount: parseFloat(bonusAmount.toFixed(2)),
                deductions: parseFloat(deductions.toFixed(2)),
                tax: parseFloat(tax.toFixed(2)),
                totalPay: parseFloat(totalPay.toFixed(2)),
                netPay: parseFloat(netPay.toFixed(2)),
                attendancePercentage: parseFloat(attendancePercentage.toFixed(2)),
                dailyHours,
                records
            });
            setError('');
        } catch (err) {
            console.error('Error calculating salary:', err);
            setError('Failed to calculate salary');
        } finally {
            setLoading(false);
        }
    };

    const calculateAllStaffSalaries = async () => {
        try {
            const allSalaries = [];
            for (const staffMember of staff) {
                const records = await getStaffAttendance(staffMember.name, monthYear);
                
                let totalHours = 0;
                let workDays = 0;
                let presentDays = 0;
                let absentDays = 0;

                records.forEach(record => {
                    // Use workHours directly if available (already calculated and stored)
                    if (record.workHours) {
                        totalHours += parseFloat(record.workHours);
                        
                        if (record.status === 'present') {
                            presentDays++;
                        } else if (record.status === 'absent') {
                            absentDays++;
                        }
                        
                        workDays++;
                    } else if (record.punchInTime && record.punchOutTime) {
                        // Fallback: Calculate from punch times if workHours not available
                        const punchIn = record.punchInTime && record.punchInTime.toDate 
                            ? record.punchInTime.toDate() 
                            : new Date(record.punchInTime);
                        const punchOut = record.punchOutTime && record.punchOutTime.toDate 
                            ? record.punchOutTime.toDate() 
                            : new Date(record.punchOutTime);
                        const hours = (punchOut - punchIn) / (1000 * 60 * 60);
                        totalHours += hours;
                        
                        if (record.status === 'present') {
                            presentDays++;
                        }
                        workDays++;
                    } else if (record.status === 'absent') {
                        absentDays++;
                    }
                });

                const standardHours = 8 * workDays;
                let basePay = 0;
                let overtimeHours = 0;
                let overtimePay = 0;

                if (staffMember.salaryType === 'hourly') {
                    basePay = Math.min(totalHours, standardHours) * (staffMember.hourlyRate || 0);
                    overtimeHours = Math.max(0, totalHours - standardHours);
                    overtimePay = overtimeHours * ((staffMember.hourlyRate || 0) * 1.5);
                } else {
                    basePay = staffMember.baseSalary || 0;
                }

                const attendancePercentage = (workDays + absentDays > 0) ? (presentDays / (workDays + absentDays)) * 100 : 0;
                const bonusAmount = attendancePercentage >= 95 ? basePay * ((staffMember.bonusPercentage || 0) / 100) : 0;
                let deductions = 0;
                if (absentDays > 2) {
                    deductions = (absentDays - 2) * (staffMember.hourlyRate || 0) * 8;
                }

                const totalPay = basePay + overtimePay + bonusAmount - deductions;
                const tax = totalPay * 0.05;
                const netPay = totalPay - tax;

                allSalaries.push({
                    name: staffMember.name,
                    position: staffMember.position,
                    totalHours: parseFloat(totalHours.toFixed(2)),
                    workDays,
                    basePay: parseFloat(basePay.toFixed(2)),
                    overtimePay: parseFloat(overtimePay.toFixed(2)),
                    bonusAmount: parseFloat(bonusAmount.toFixed(2)),
                    deductions: parseFloat(deductions.toFixed(2)),
                    tax: parseFloat(tax.toFixed(2)),
                    netPay: parseFloat(netPay.toFixed(2)),
                    totalPay: parseFloat(totalPay.toFixed(2)),
                    attendancePercentage: parseFloat(attendancePercentage.toFixed(2))
                });
            }
            setAllStaffSalaries(allSalaries);
        } catch (err) {
            console.error('Error calculating all salaries:', err);
        }
    };

    const filteredStaff = staff.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.position.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (value) => `₹${parseFloat(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div>
            {error && <div style={{ background: 'var(--error-bg)', color: 'var(--error)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>{error}</div>}

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setViewMode('detail')}
                    style={{
                        padding: '0.5rem 1rem',
                        background: viewMode === 'detail' ? 'var(--primary)' : 'var(--secondary)',
                        color: viewMode === 'detail' ? 'white' : 'var(--foreground)',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    <Clock size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
                    Individual Details
                </button>
                <button
                    onClick={() => setViewMode('overview')}
                    style={{
                        padding: '0.5rem 1rem',
                        background: viewMode === 'overview' ? 'var(--primary)' : 'var(--secondary)',
                        color: viewMode === 'overview' ? 'white' : 'var(--foreground)',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    <BarChart3 size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
                    All Staff Overview
                </button>

                <div style={{ marginLeft: 'auto' }}>
                    <input
                        type="month"
                        value={monthYear}
                        onChange={(e) => setMonthYear(e.target.value)}
                        style={{
                            padding: '0.5rem 1rem',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '0.375rem',
                            background: 'var(--secondary)',
                            color: 'var(--foreground)',
                            cursor: 'pointer'
                        }}
                    />
                </div>
            </div>

            {/* Detail View */}
            {viewMode === 'detail' && (
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
                    {/* Staff Selection */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">
                                <Users size={18} />
                                Staff Members
                            </h3>
                        </div>
                        <div className="card-content">
                            <div style={{ marginBottom: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder="Search staff..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="input"
                                    style={{ fontSize: '0.875rem' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '600px', overflowY: 'auto' }}>
                                {filteredStaff.map(member => (
                                    <button
                                        key={member.id}
                                        onClick={() => setSelectedStaff(member)}
                                        style={{
                                            padding: '0.75rem',
                                            textAlign: 'left',
                                            background: selectedStaff?.id === member.id ? 'var(--primary)' : 'var(--secondary)',
                                            color: selectedStaff?.id === member.id ? 'white' : 'var(--foreground)',
                                            border: 'none',
                                            borderRadius: '0.375rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{member.name}</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{member.position}</div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '0.25rem' }}>₹{member.hourlyRate}/hour</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Salary Details */}
                    {salaryData && (
                        <div>
                            {/* Header Card */}
                            <div className="card" style={{ marginBottom: '1.5rem' }}>
                                <div className="card-header">
                                    <div>
                                        <h2 className="card-title">{salaryData.staffMember.name}</h2>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
                                            {salaryData.staffMember.position} • {salaryData.monthYear}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Key Metrics - 4 Column Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                                {/* Attendance */}
                                <div className="card">
                                    <div className="card-content">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Attendance Rate</div>
                                                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>{salaryData.attendancePercentage}%</div>
                                            </div>
                                            <div style={{ fontSize: '2rem', opacity: 0.2 }}>📊</div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                                            <div><span style={{ color: 'var(--muted-foreground)' }}>Present:</span> {salaryData.presentDays}</div>
                                            <div><span style={{ color: 'var(--muted-foreground)' }}>Absent:</span> {salaryData.absentDays}</div>
                                            <div><span style={{ color: 'var(--muted-foreground)' }}>Work Days:</span> {salaryData.workDays}</div>
                                            <div><span style={{ color: 'var(--muted-foreground)' }}>Half Days:</span> {salaryData.halfDays}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Hours Worked */}
                                <div className="card">
                                    <div className="card-content">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Total Hours</div>
                                                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>{salaryData.totalHours}</div>
                                            </div>
                                            <div style={{ fontSize: '2rem', opacity: 0.2 }}>⏱️</div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                                            <div><span style={{ color: 'var(--muted-foreground)' }}>Standard:</span> {salaryData.standardHours}</div>
                                            <div><span style={{ color: '#f59e0b' }}>Overtime:</span> {salaryData.overtimeHours}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Base Pay */}
                                <div className="card">
                                    <div className="card-content">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Base Pay</div>
                                                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#10b981' }}>{formatCurrency(salaryData.basePay)}</div>
                                            </div>
                                            <div style={{ fontSize: '2rem', opacity: 0.2 }}>💰</div>
                                        </div>
                                        {salaryData.overtimePay > 0 && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                                Overtime: <span style={{ color: '#f59e0b', fontWeight: '600' }}>{formatCurrency(salaryData.overtimePay)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Deductions & Bonuses */}
                                <div className="card">
                                    <div className="card-content">
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Bonus</div>
                                                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10b981' }}>+{formatCurrency(salaryData.bonusAmount)}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Deductions</div>
                                                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ef4444' }}>-{formatCurrency(salaryData.deductions)}</div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                            Tax: <span style={{ color: 'var(--foreground)', fontWeight: '600' }}>-{formatCurrency(salaryData.tax)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Net Pay Card - Large */}
                            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)', border: '2px solid rgba(16, 185, 129, 0.3)' }}>
                                <div className="card-content" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>NET SALARY (Take Home)</div>
                                    <div style={{ fontSize: '3rem', fontWeight: '800', color: '#10b981', marginBottom: '0.5rem' }}>
                                        {formatCurrency(salaryData.netPay)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                        Total Pay: {formatCurrency(salaryData.totalPay)}
                                    </div>
                                </div>
                            </div>

                            {/* Breakdown Table */}
                            <div className="card" style={{ marginTop: '1.5rem' }}>
                                <div className="card-header">
                                    <h3 className="card-title">Salary Breakdown</h3>
                                </div>
                                <div className="card-content" style={{ padding: 0 }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>Hourly Rate</td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600' }}>₹{salaryData.staffMember.hourlyRate}/hr</td>
                                            </tr>
                                            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>Standard Hours</td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600' }}>{salaryData.standardHours} hrs</td>
                                            </tr>
                                            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>Overtime Hours</td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600' }}>{salaryData.overtimeHours} hrs @ 1.5x</td>
                                            </tr>
                                            <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(139, 92, 246, 0.05)' }}>
                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: '600' }}>Base Pay</td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '700', color: '#10b981' }}>+{formatCurrency(salaryData.basePay)}</td>
                                            </tr>
                                            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: '600' }}>Overtime Pay (1.5x)</td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '700', color: '#f59e0b' }}>+{formatCurrency(salaryData.overtimePay)}</td>
                                            </tr>
                                            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: '600' }}>Performance Bonus</td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '700', color: '#10b981' }}>+{formatCurrency(salaryData.bonusAmount)}</td>
                                            </tr>
                                            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: '600' }}>Deductions (Absence)</td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '700', color: '#ef4444' }}>-{formatCurrency(salaryData.deductions)}</td>
                                            </tr>
                                            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: '600' }}>Income Tax (5%)</td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '700', color: '#ef4444' }}>-{formatCurrency(salaryData.tax)}</td>
                                            </tr>
                                            <tr style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                                                <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: '700' }}>NET SALARY</td>
                                                <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1rem', fontWeight: '800', color: '#10b981' }}>{formatCurrency(salaryData.netPay)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Overview Mode */}
            {viewMode === 'overview' && (
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">
                            <BarChart3 size={20} />
                            All Staff Payroll Summary - {monthYear}
                        </h2>
                    </div>
                    <div className="card-content" style={{ padding: 0, maxHeight: '800px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                            <thead>
                                <tr style={{ background: 'var(--option-bg)', position: 'sticky', top: 0, zIndex: 10 }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Name</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Position</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Attendance</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Hours</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Base Pay</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Overtime</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Bonus</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Deductions</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Net Pay</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allStaffSalaries.map((salary, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)', hover: { background: 'var(--secondary)' } }}>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600' }}>{salary.name}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{salary.position}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: salary.attendancePercentage >= 95 ? '#10b981' : salary.attendancePercentage >= 80 ? '#f59e0b' : '#ef4444' }}>
                                            {salary.attendancePercentage}%
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>{salary.totalHours}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#10b981' }}>{formatCurrency(salary.basePay)}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: salary.overtimePay > 0 ? '#f59e0b' : 'var(--muted-foreground)' }}>{formatCurrency(salary.overtimePay)}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: salary.bonusAmount > 0 ? '#10b981' : 'var(--muted-foreground)' }}>{formatCurrency(salary.bonusAmount)}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: salary.deductions > 0 ? '#ef4444' : 'var(--muted-foreground)' }}>-{formatCurrency(salary.deductions)}</td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: '700', color: '#10b981' }}>{formatCurrency(salary.netPay)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ background: 'rgba(139, 92, 246, 0.1)', fontWeight: '700' }}>
                                    <td colSpan="4" style={{ padding: '1rem', fontSize: '0.875rem' }}>TOTAL PAYROLL</td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#10b981' }}>
                                        {formatCurrency(allStaffSalaries.reduce((sum, s) => sum + s.basePay, 0))}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#f59e0b' }}>
                                        {formatCurrency(allStaffSalaries.reduce((sum, s) => sum + s.overtimePay, 0))}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#10b981' }}>
                                        {formatCurrency(allStaffSalaries.reduce((sum, s) => sum + s.bonusAmount, 0))}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#ef4444' }}>
                                        -{ formatCurrency(allStaffSalaries.reduce((sum, s) => sum + s.deductions, 0))}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1rem', color: '#10b981' }}>
                                        {formatCurrency(allStaffSalaries.reduce((sum, s) => sum + s.netPay, 0))}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffSalaryAnalytics;
