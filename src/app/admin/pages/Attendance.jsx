import { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  LogIn,
  LogOut,
  Calendar,
  Trash2,
  Edit2,
  Download,
  Users,
  TrendingUp,
  AlertCircle,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Eye,
  Save
} from 'lucide-react';
import {
  getStaff,
  punchInStaff,
  punchOutStaff,
  getStaffAttendance,
  calculateStaffCommission,
  convertTimestampToDate,
  getTodayPunchStatus,
  deleteAttendanceRecord,
  updateAttendanceRecord,
  getAttendanceStats,
  getAllStaffAttendanceStats,
  markAttendanceManual,
  bulkMarkAttendance,
  getMonthlyAttendanceReport
} from '../utils/firebaseUtils';

const Attendance = () => {
  // ============== STATE MANAGEMENT ==============
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [allStaffStats, setAllStaffStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [monthYear, setMonthYear] = useState(new Date().toISOString().slice(0, 7));
  const [commission, setCommission] = useState(null);
  const [todayPunchStatus, setTodayPunchStatus] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [viewMode, setViewMode] = useState('individual'); // 'individual', 'overview', 'calendar', 'report'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'present', 'absent'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showManualMarkModal, setShowManualMarkModal] = useState(false);
  const [manualMarkData, setManualMarkData] = useState({
    punchInTime: '09:00',
    punchOutTime: '17:00',
    status: 'present'
  });
  const [editingRecord, setEditingRecord] = useState(null);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedStaffForBulk, setSelectedStaffForBulk] = useState([]);
  const [showBulkMarkModal, setShowBulkMarkModal] = useState(false);
  const [bulkMarkData, setBulkMarkData] = useState({
    selectedDays: [],
    punchInTime: '09:00',
    punchOutTime: '17:00',
    status: 'present'
  });
  const [viewingRecord, setViewingRecord] = useState(null);
  const [editingRecordModal, setEditingRecordModal] = useState(null);

  // ============== EFFECTS ==============
  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (selectedStaff) {
      handleSelectStaff(selectedStaff);
    }
  }, [monthYear]);

  // ============== FETCH FUNCTIONS ==============
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await getStaff(false);
      setStaff(data);
      if (data.length > 0) {
        setSelectedStaff(data[0]);
        await loadStaffData(data[0]);
      }
      setError('');
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const loadStaffData = async (staffMember) => {
    try {
      setLoading(true);
      const records = await getStaffAttendance(staffMember.name, monthYear);
      setAttendanceRecords(records);

      const status = await getTodayPunchStatus(staffMember.id, staffMember.name);
      setTodayPunchStatus(status);

      const comm = await calculateStaffCommission(staffMember.id, monthYear);
      setCommission(comm);

      const stats = await getAttendanceStats(staffMember.name, monthYear);
      setAttendanceStats(stats);

      setError('');
    } catch (err) {
      console.error('Error loading staff data:', err);
      setError('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStaff = async (staffMember) => {
    setSelectedStaff(staffMember);
    await loadStaffData(staffMember);
  };

  const loadOverviewStats = async () => {
    try {
      setLoading(true);
      const stats = await getAllStaffAttendanceStats(staff, monthYear);
      setAllStaffStats(stats);
      setError('');
    } catch (err) {
      console.error('Error loading overview:', err);
      setError('Failed to load overview data');
    } finally {
      setLoading(false);
    }
  };

  // ============== PUNCH ACTIONS ==============
  const handlePunchIn = async () => {
    if (!selectedStaff) return;
    try {
      setLoading(true);
      await punchInStaff(selectedStaff.id, selectedStaff.name);
      await new Promise(resolve => setTimeout(resolve, 500));

      const today = new Date();
      const monthString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const records = await getStaffAttendance(selectedStaff.name, monthString);
      setAttendanceRecords(records);

      const status = await getTodayPunchStatus(selectedStaff.id, selectedStaff.name);
      setTodayPunchStatus(status);

      setSuccess('✓ Punched in successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error punching in:', err);
      setError(err.message || 'Failed to punch in');
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async () => {
    if (!selectedStaff) return;
    try {
      setLoading(true);
      await punchOutStaff(selectedStaff.id, selectedStaff.name);
      await new Promise(resolve => setTimeout(resolve, 500));

      const today = new Date();
      const monthString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const records = await getStaffAttendance(selectedStaff.name, monthString);
      setAttendanceRecords(records);

      const status = await getTodayPunchStatus(selectedStaff.id, selectedStaff.name);
      setTodayPunchStatus(status);

      setSuccess('✓ Punched out successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error punching out:', err);
      setError(err.message || 'Failed to punch out');
    } finally {
      setLoading(false);
    }
  };

  // ============== MANUAL ATTENDANCE ==============
  const handleMarkManual = async () => {
    if (!selectedStaff) return;
    try {
      setLoading(true);
      const today = new Date(selectedDate);
      // Only set punch times for present/half-day, not for absent/leave
      const punchInTime = ['present', 'half-day'].includes(manualMarkData.status) 
        ? new Date(selectedDate + 'T' + manualMarkData.punchInTime)
        : null;
      const punchOutTime = ['present', 'half-day'].includes(manualMarkData.status)
        ? new Date(selectedDate + 'T' + manualMarkData.punchOutTime)
        : null;

      await markAttendanceManual(
        selectedStaff.id,
        selectedStaff.name,
        today,
        punchInTime,
        punchOutTime,
        manualMarkData.status
      );

      await new Promise(resolve => setTimeout(resolve, 500));
      const records = await getStaffAttendance(selectedStaff.name, monthYear);
      setAttendanceRecords(records);

      const stats = await getAttendanceStats(selectedStaff.name, monthYear);
      setAttendanceStats(stats);

      setShowManualMarkModal(false);
      setSuccess('✓ Attendance marked manually!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error marking attendance:', err);
      setError('Failed to mark attendance: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkMark = async () => {
    if (selectedStaffForBulk.length === 0) {
      setError('Please select staff members');
      return;
    }
    if (bulkMarkData.selectedDays.length === 0) {
      setError('Please select at least one day');
      return;
    }
    try {
      setLoading(true);
      const staffToMark = staff.filter(s => selectedStaffForBulk.includes(s.id));
      
      for (const day of bulkMarkData.selectedDays) {
        // Only set punch times for present/half-day, not for absent/leave
        const punchInTime = ['present', 'half-day'].includes(bulkMarkData.status)
          ? new Date(day + 'T' + bulkMarkData.punchInTime)
          : null;
        const punchOutTime = ['present', 'half-day'].includes(bulkMarkData.status)
          ? new Date(day + 'T' + bulkMarkData.punchOutTime)
          : null;
        
        for (const staffMember of staffToMark) {
          await markAttendanceManual(
            staffMember.id,
            staffMember.name,
            new Date(day),
            punchInTime,
            punchOutTime,
            bulkMarkData.status
          );
        }
      }

      setSuccess(`✓ Marked ${staffToMark.length} staff members for ${bulkMarkData.selectedDays.length} day(s)!`);
      setTimeout(() => setSuccess(''), 3000);
      setSelectedStaffForBulk([]);
      setBulkSelectMode(false);
      setShowBulkMarkModal(false);
      setBulkMarkData({ selectedDays: [], punchInTime: '09:00', punchOutTime: '17:00', status: 'present' });

      if (selectedStaff) {
        const records = await getStaffAttendance(selectedStaff.name, monthYear);
        setAttendanceRecords(records);
      }
    } catch (err) {
      console.error('Error in bulk marking:', err);
      setError('Failed to mark attendance: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============== RECORD MANAGEMENT ==============
  const handleDeleteRecord = async (recordId, record) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
    try {
      setLoading(true);
      setError('');
      const dateStr = record.dateStr || recordId;
      
      console.log('Deleting record:', { staffName: selectedStaff?.name, dateStr, record });
      
      await deleteAttendanceRecord(selectedStaff.name, dateStr);
      
      console.log('Record deleted successfully');
      await new Promise(resolve => setTimeout(resolve, 500));

      if (selectedStaff) {
        // Use the current monthYear from state, not today's date
        const records = await getStaffAttendance(selectedStaff.name, monthYear);
        setAttendanceRecords(records);

        const updatedStatus = await getTodayPunchStatus(selectedStaff.id, selectedStaff.name);
        setTodayPunchStatus(updatedStatus);
        
        const stats = await getAttendanceStats(selectedStaff.name, monthYear);
        setAttendanceStats(stats);
      }

      setSuccess('✓ Record deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setViewingRecord(null);
      setEditingRecordModal(null);
    } catch (err) {
      console.error('Error deleting record:', err);
      setError('Failed to delete record: ' + (err.message || 'Unknown error'));
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRecord = async (record, field, newValue) => {
    try {
      setLoading(true);
      const dateStr = record.dateStr || record.id;
      await updateAttendanceRecord(selectedStaff.name, dateStr, { [field]: newValue });

      const updated = attendanceRecords.map(r =>
        r.id === record.id ? { ...r, [field]: newValue } : r
      );
      setAttendanceRecords(updated);
      setEditingRecord(null);
      setEditingRecordModal(null);
      setSuccess('✓ Record updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating record:', err);
      setError('Failed to update record');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditingRecord = async () => {
    if (!editingRecordModal) return;
    try {
      setLoading(true);
      const dateStr = editingRecordModal.dateStr || editingRecordModal.id;
      
      const updateData = {};
      if (editingRecordModal.punchInTime !== editingRecordModal.originalPunchInTime) {
        updateData.punchInTime = editingRecordModal.punchInTime;
      }
      if (editingRecordModal.punchOutTime !== editingRecordModal.originalPunchOutTime) {
        updateData.punchOutTime = editingRecordModal.punchOutTime;
      }
      if (editingRecordModal.status !== editingRecordModal.originalStatus) {
        updateData.status = editingRecordModal.status;
      }
      
      if (Object.keys(updateData).length > 0) {
        await updateAttendanceRecord(selectedStaff.name, dateStr, updateData);
        
        const updated = attendanceRecords.map(r => {
          if (r.id === editingRecordModal.id) {
            return {
              ...r,
              ...updateData,
              punchInTime: updateData.punchInTime || r.punchInTime,
              punchOutTime: updateData.punchOutTime || r.punchOutTime,
              status: updateData.status || r.status
            };
          }
          return r;
        });
        setAttendanceRecords(updated);
      }
      
      setEditingRecordModal(null);
      setSuccess('✓ Record updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating record:', err);
      setError('Failed to update record: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============== EXPORT FUNCTIONS ==============
  const exportToCSV = async () => {
    try {
      const report = await getMonthlyAttendanceReport(selectedStaff.name, monthYear);
      const csvContent = [
        ['Date', 'Day', 'Punch In', 'Punch Out', 'Work Hours', 'Status'],
        ...report.map(r => [r.date, r.dayName, r.punchInTime, r.punchOutTime, r.workHours, r.status])
      ]
        .map(row => row.join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedStaff.name}_attendance_${monthYear}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      setSuccess('✓ Report exported!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error exporting:', err);
      setError('Failed to export report');
    }
  };

  // ============== FILTERING ==============
  const filteredRecords = attendanceRecords.filter(record => {
    if (filterStatus !== 'all' && record.status !== filterStatus) return false;
    return true;
  });

  const filteredStaff = staff.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ============== CALENDAR FUNCTIONS ==============
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const [year, month] = monthYear.split('-').map(Number);
    const daysInMonth = getDaysInMonth(year, month - 1);
    const firstDay = getFirstDayOfMonth(year, month - 1);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return weeks;
  };

  const getDateStatus = (day) => {
    if (!day) return null;
    const dateStr = `${monthYear}-${String(day).padStart(2, '0')}`;
    const record = attendanceRecords.find(r => r.dateStr === dateStr);
    return record;
  };

  // ============== RENDER COMPONENTS ==============

  const renderStaffList = () => (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <Users size={20} />
          Staff Members
        </h2>
      </div>
      <div className="card-content">
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Search staff..."
            className="input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {filteredStaff.map(member => (
            <button
              key={member.id}
              onClick={() => handleSelectStaff(member)}
              className="btn btn-ghost"
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                padding: '0.75rem',
                marginBottom: '0.5rem',
                background: selectedStaff?.id === member.id ? 'var(--secondary)' : 'transparent',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{member.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                  {member.position}
                </div>
              </div>
              {member.isActive && (
                <div style={{
                  fontSize: '0.75rem',
                  background: 'var(--success)',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px'
                }}>
                  Active
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPunchCard = () => (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <Clock size={20} />
          Punch Controls
        </h2>
      </div>
      <div className="card-content">
        {todayPunchStatus && (
          <div style={{
            marginBottom: '1rem',
            padding: '1rem',
            background: todayPunchStatus.hasPunchedIn
              ? 'rgba(16, 185, 129, 0.1)'
              : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${todayPunchStatus.hasPunchedIn
              ? 'rgba(16, 185, 129, 0.2)'
              : 'rgba(239, 68, 68, 0.2)'}`,
            borderRadius: 'var(--radius)',
            color: todayPunchStatus.hasPunchedIn ? '#10b981' : '#ef4444'
          }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
              {todayPunchStatus.hasPunchedIn ? '✓ Punched In' : '✗ Not Punched In'}
            </div>
            {todayPunchStatus.hasPunchedOut && (
              <div style={{ fontSize: '0.875rem' }}>Status: Punched Out at {
                attendanceRecords[0]?.punchOutTime
                  ? convertTimestampToDate(attendanceRecords[0].punchOutTime)?.toLocaleTimeString()
                  : 'N/A'
              }</div>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          <button
            onClick={handlePunchIn}
            className="btn btn-success"
            disabled={loading || (todayPunchStatus?.hasPunchedIn && !todayPunchStatus?.hasPunchedOut)}
            style={{ opacity: loading || (todayPunchStatus?.hasPunchedIn && !todayPunchStatus?.hasPunchedOut) ? 0.5 : 1 }}
          >
            <LogIn size={16} />
            Punch In
          </button>
          <button
            onClick={handlePunchOut}
            className="btn btn-danger"
            disabled={loading || !todayPunchStatus?.hasPunchedIn || todayPunchStatus?.hasPunchedOut}
            style={{ opacity: loading || !todayPunchStatus?.hasPunchedIn || todayPunchStatus?.hasPunchedOut ? 0.5 : 1 }}
          >
            <LogOut size={16} />
            Punch Out
          </button>
        </div>

        <button
          onClick={() => setShowManualMarkModal(true)}
          className="btn btn-secondary"
          style={{ width: '100%', marginBottom: '1rem' }}
        >
          <Edit2 size={16} />
          Mark Manually
        </button>

        <button
          onClick={() => setShowBulkMarkModal(true)}
          className="btn btn-ghost"
          style={{ width: '100%' }}
        >
          <Users size={16} />
          Bulk Mark (Multiple Days)
        </button>
      </div>
    </div>
  );

  const renderStatsCard = () => (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <BarChart3 size={20} />
          Statistics
        </h2>
      </div>
      <div className="card-content">
        {attendanceStats ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{
              padding: '1rem',
              background: 'var(--secondary)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                Attendance %
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>
                {attendanceStats.attendancePercentage}%
              </div>
            </div>

            <div style={{
              padding: '1rem',
              background: 'var(--secondary)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                Present Days
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                {attendanceStats.totalPresent}/{attendanceStats.totalDaysInMonth}
              </div>
            </div>

            <div style={{
              padding: '1rem',
              background: 'var(--secondary)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                Total Work Hours
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                {attendanceStats.totalWorkHours}h
              </div>
            </div>

            <div style={{
              padding: '1rem',
              background: 'var(--secondary)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                Avg per Day
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                {attendanceStats.averageWorkHoursPerDay}h
              </div>
            </div>

            {attendanceStats.lateArrivals > 0 && (
              <div style={{
                padding: '1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-sm)',
                color: '#ef4444'
              }}>
                <AlertCircle size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
                Late Arrivals: {attendanceStats.lateArrivals}
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: 'var(--muted-foreground)' }}>No data available</p>
        )}
      </div>
    </div>
  );

  const renderCommissionCard = () => (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <TrendingUp size={20} />
          Commission
        </h2>
      </div>
      <div className="card-content">
        <div style={{ marginBottom: '1rem' }}>
          <label className="label">Select Month</label>
          <input
            type="month"
            className="input"
            value={monthYear}
            onChange={(e) => setMonthYear(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        {commission && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, rgba(232, 197, 71, 0.1) 0%, rgba(201, 162, 39, 0.05) 100%)',
              border: '1px solid rgba(201, 162, 39, 0.2)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                Monthly Commission (10%)
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>
                ₹{commission.totalCommission?.toFixed(2) || '0.00'}
              </div>
            </div>

            <div style={{
              padding: '0.75rem',
              background: 'var(--secondary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem'
            }}>
              <div>Total Service Amount: ₹{commission.totalServiceAmount?.toFixed(2) || '0.00'}</div>
              <div style={{ color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
                {commission.invoiceCount} invoices
              </div>
              <div style={{ color: 'var(--muted-foreground)', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                Paid Amount: ₹{commission.paidAmount?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderAttendanceRecords = () => (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <Calendar size={20} />
          Attendance Records
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            className="input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ fontSize: '0.875rem', padding: '0.5rem' }}
          >
            <option value="all">All</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
          <button onClick={exportToCSV} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            <Download size={16} />
            Export
          </button>
        </div>
      </div>
      <div className="card-content">
        {filteredRecords.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Punch In</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Punch Out</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Hours</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} style={{
                    borderBottom: '1px solid var(--border)',
                    background: record.status === 'absent' ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                  }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                      {new Date(record.dateStr).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {record.punchInTime
                        ? convertTimestampToDate(record.punchInTime)?.toLocaleTimeString()
                        : '-'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {record.punchOutTime
                        ? convertTimestampToDate(record.punchOutTime)?.toLocaleTimeString()
                        : '-'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {editingRecord?.id === record.id ? (
                        <input
                          type="number"
                          value={editingRecord.value}
                          onChange={(e) => setEditingRecord({
                            ...editingRecord,
                            value: parseFloat(e.target.value)
                          })}
                          style={{ width: '60px', padding: '0.25rem' }}
                          step="0.1"
                        />
                      ) : (
                        record.workHours
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        background: record.status === 'present' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: record.status === 'present' ? '#10b981' : '#ef4444',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {record.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => setViewingRecord(record)}
                          className="btn btn-ghost"
                          disabled={loading}
                          style={{ padding: '0.25rem 0.5rem' }}
                          title="View details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingRecordModal({
                              ...record,
                              originalPunchInTime: record.punchInTime,
                              originalPunchOutTime: record.punchOutTime,
                              originalStatus: record.status
                            });
                          }}
                          className="btn btn-ghost"
                          disabled={loading}
                          style={{ padding: '0.25rem 0.5rem' }}
                          title="Edit record"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(record.id, record)}
                          className="btn btn-ghost"
                          disabled={loading}
                          style={{ padding: '0.25rem 0.5rem', color: '#ef4444' }}
                          title="Delete record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--muted-foreground)', textAlign: 'center', padding: '2rem' }}>
            No attendance records found
          </p>
        )}
      </div>
    </div>
  );

  const renderCalendarView = () => {
    const weeks = renderCalendar();
    const [year, month] = monthYear.split('-').map(Number);
    const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
      <div style={{ display: 'grid', gap: '2rem' }}>
        {/* Header Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {attendanceStats && (
            <>
              <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)' }}>
                <div className="card-content" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>Attendance Rate</div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>{attendanceStats.attendancePercentage}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>{attendanceStats.totalPresent}/{attendanceStats.totalDaysInMonth} days</div>
                </div>
              </div>

              <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)' }}>
                <div className="card-content" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>Total Hours</div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>{attendanceStats.totalWorkHours}h</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>Avg: {attendanceStats.averageWorkHoursPerDay}h/day</div>
                </div>
              </div>

              <div className="card" style={{ background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)' }}>
                <div className="card-content" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>Absent Days</div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f97316' }}>{attendanceStats.totalAbsent || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>Out of {attendanceStats.totalDaysInMonth}</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Calendar */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">
              <Calendar size={20} />
              {monthName} - {selectedStaff?.name}
            </h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowManualMarkModal(true)}
                className="btn btn-secondary"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                <Edit2 size={16} />
                Mark Manually
              </button>
              <button
                onClick={() => setShowBulkMarkModal(true)}
                className="btn btn-secondary"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                <Users size={16} />
                Bulk Mark
              </button>
            </div>
          </div>
          
          <div className="card-content">
            {/* Day Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                <div key={day} style={{
                  padding: '1rem',
                  textAlign: 'center',
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  background: 'var(--primary)',
                  color: 'white',
                  borderRadius: 'var(--radius-sm)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {day.slice(0, 3)}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
              {weeks.map((week, weekIdx) =>
                week.map((day, dayIdx) => {
                  const record = day ? getDateStatus(day) : null;
                  const dateStr = day ? `${monthYear}-${String(day).padStart(2, '0')}` : null;
                  const isToday = dateStr === new Date().toISOString().split('T')[0];
                  
                  return (
                    <div
                      key={`${weekIdx}-${dayIdx}`}
                      onClick={() => day && record && setViewingRecord(record)}
                      style={{
                        padding: '1rem',
                        textAlign: 'center',
                        background: day ? (
                          record ? (
                            record.status === 'present' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'
                          ) : 'var(--secondary)'
                        ) : 'transparent',
                        border: isToday 
                          ? '2px solid var(--primary)' 
                          : record 
                          ? `2px solid ${record.status === 'present' ? '#10b981' : '#ef4444'}`
                          : '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: day && record ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                        minHeight: '80px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        if (day && record) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (day && record) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                      title={record ? `${record.status.toUpperCase()} - ${record.workHours}h` : ''}
                    >
                      {day && (
                        <>
                          <div style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                            {day}
                          </div>
                          {isToday && (
                            <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: '600', marginBottom: '0.25rem' }}>
                              TODAY
                            </div>
                          )}
                          {record ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                              <span style={{
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                color: record.status === 'present' ? '#10b981' : '#ef4444',
                                padding: '0.25rem 0.5rem',
                                background: record.status === 'present' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                borderRadius: '999px'
                              }}>
                                {record.status === 'present' ? '✓' : '✗'}
                              </span>
                              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--primary)' }}>
                                {record.workHours}h
                              </span>
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>-</div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Legend */}
            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '16px', height: '16px', background: '#10b981', borderRadius: '4px' }}></div>
                <span style={{ fontSize: '0.875rem' }}>Present</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '16px', height: '16px', background: '#ef4444', borderRadius: '4px' }}></div>
                <span style={{ fontSize: '0.875rem' }}>Absent</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '16px', height: '16px', background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: '4px' }}></div>
                <span style={{ fontSize: '0.875rem' }}>No Record</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOverviewTable = () => (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <Users size={20} />
          All Staff Attendance Overview
        </h2>
        <button onClick={loadOverviewStats} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
          Refresh
        </button>
      </div>
      <div className="card-content">
        {allStaffStats.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Present</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Attendance %</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Total Hours</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Avg/Day</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Late</th>
                </tr>
              </thead>
              <tbody>
                {allStaffStats.map((stat) => (
                  <tr key={stat.staffName} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{stat.staffName}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      {stat.totalPresent}/{stat.totalDaysInMonth}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{
                        background: 'var(--secondary)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px'
                      }}>
                        {stat.attendancePercentage}%
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      {stat.totalWorkHours}h
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      {stat.averageWorkHoursPerDay}h
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{
                        color: stat.lateArrivals > 0 ? '#ef4444' : '#10b981',
                        fontWeight: 600
                      }}>
                        {stat.lateArrivals}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--muted-foreground)', textAlign: 'center' }}>
            No data available. Click Refresh to load data.
          </p>
        )}
      </div>
    </div>
  );

  const renderManualMarkModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: showManualMarkModal ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--background)',
        borderRadius: 'var(--radius)',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Mark Attendance - {selectedStaff?.name}</span>
          <button onClick={() => setShowManualMarkModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label className="label" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Date</label>
          <input
            type="date"
            className="input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', display: ['present', 'half-day'].includes(manualMarkData.status) ? 'grid' : 'none' }}>
          <div>
            <label className="label" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
              <LogIn size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Punch In Time
            </label>
            <input
              type="time"
              className="input"
              value={manualMarkData.punchInTime}
              onChange={(e) => setManualMarkData({
                ...manualMarkData,
                punchInTime: e.target.value
              })}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label className="label" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
              <LogOut size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Punch Out Time
            </label>
            <input
              type="time"
              className="input"
              value={manualMarkData.punchOutTime}
              onChange={(e) => setManualMarkData({
                ...manualMarkData,
                punchOutTime: e.target.value
              })}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {['present', 'half-day'].includes(manualMarkData.status) && manualMarkData.punchInTime && manualMarkData.punchOutTime && (
          <div style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            background: 'var(--secondary)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem'
          }}>
            <strong>Work Duration:</strong> {
              (() => {
                const [inH, inM] = manualMarkData.punchInTime.split(':').map(Number);
                const [outH, outM] = manualMarkData.punchOutTime.split(':').map(Number);
                const inMinutes = inH * 60 + inM;
                const outMinutes = outH * 60 + outM;
                const diffMinutes = Math.max(0, outMinutes - inMinutes);
                const hours = Math.floor(diffMinutes / 60);
                const minutes = diffMinutes % 60;
                return `${hours}h ${minutes}m`;
              })()
            }
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="label" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Status</label>
          <select
            className="input"
            value={manualMarkData.status}
            onChange={(e) => setManualMarkData({
              ...manualMarkData,
              status: e.target.value
            })}
            style={{ width: '100%' }}
          >
            <option value="present">✓ Present</option>
            <option value="absent">✗ Absent</option>
            <option value="leave">📋 Leave</option>
            <option value="half-day">◐ Half Day</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button
            onClick={handleMarkManual}
            className="btn btn-success"
            disabled={loading}
            style={{ opacity: loading ? 0.5 : 1 }}
          >
            <Save size={16} style={{ marginRight: '0.5rem' }} />
            Mark
          </button>
          <button
            onClick={() => setShowManualMarkModal(false)}
            className="btn btn-ghost"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const renderBulkMarkModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: showBulkMarkModal ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      overflowY: 'auto'
    }}>
      <div style={{
        background: 'var(--background)',
        borderRadius: 'var(--radius)',
        padding: '2rem',
        maxWidth: '600px',
        width: '90%',
        margin: 'auto'
      }}>
        <div style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Bulk Mark Attendance</span>
          <button onClick={() => setShowBulkMarkModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="label" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Select Staff Members</label>
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
            {staff.map(member => (
              <label key={member.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedStaffForBulk.includes(member.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedStaffForBulk([...selectedStaffForBulk, member.id]);
                    } else {
                      setSelectedStaffForBulk(selectedStaffForBulk.filter(id => id !== member.id));
                    }
                  }}
                  style={{ marginRight: '0.75rem' }}
                />
                <span>{member.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginLeft: 'auto' }}>{member.role}</span>
              </label>
            ))}
          </div>
          {selectedStaffForBulk.length > 0 && (
            <div style={{ fontSize: '0.875rem', color: 'var(--primary)', marginTop: '0.5rem' }}>
              {selectedStaffForBulk.length} staff member(s) selected
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="label" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Select Dates</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
            {Array.from({ length: getDaysInMonth(new Date(monthYear + '-01').getFullYear(), new Date(monthYear + '-01').getMonth()) }, (_, i) => {
              const day = i + 1;
              const dateStr = `${monthYear}-${String(day).padStart(2, '0')}`;
              return (
                <label key={dateStr} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={bulkMarkData.selectedDays.includes(dateStr)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBulkMarkData({
                          ...bulkMarkData,
                          selectedDays: [...bulkMarkData.selectedDays, dateStr].sort()
                        });
                      } else {
                        setBulkMarkData({
                          ...bulkMarkData,
                          selectedDays: bulkMarkData.selectedDays.filter(d => d !== dateStr)
                        });
                      }
                    }}
                    style={{ marginRight: '0.75rem' }}
                  />
                  <span style={{ fontSize: '0.875rem' }}>{new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </label>
              );
            })}
          </div>
          {bulkMarkData.selectedDays.length > 0 && (
            <div style={{ fontSize: '0.875rem', color: 'var(--primary)', marginTop: '0.5rem' }}>
              {bulkMarkData.selectedDays.length} day(s) selected
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', display: ['present', 'half-day'].includes(bulkMarkData.status) ? 'grid' : 'none' }}>
          <div>
            <label className="label" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
              <LogIn size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Punch In Time
            </label>
            <input
              type="time"
              className="input"
              value={bulkMarkData.punchInTime}
              onChange={(e) => setBulkMarkData({
                ...bulkMarkData,
                punchInTime: e.target.value
              })}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label className="label" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
              <LogOut size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Punch Out Time
            </label>
            <input
              type="time"
              className="input"
              value={bulkMarkData.punchOutTime}
              onChange={(e) => setBulkMarkData({
                ...bulkMarkData,
                punchOutTime: e.target.value
              })}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="label" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Status</label>
          <select
            className="input"
            value={bulkMarkData.status}
            onChange={(e) => setBulkMarkData({
              ...bulkMarkData,
              status: e.target.value
            })}
            style={{ width: '100%' }}
          >
            <option value="present">✓ Present</option>
            <option value="absent">✗ Absent</option>
            <option value="leave">📋 Leave</option>
            <option value="half-day">◐ Half Day</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button
            onClick={handleBulkMark}
            className="btn btn-success"
            disabled={loading || selectedStaffForBulk.length === 0 || bulkMarkData.selectedDays.length === 0}
            style={{ opacity: loading || selectedStaffForBulk.length === 0 || bulkMarkData.selectedDays.length === 0 ? 0.5 : 1 }}
          >
            <Save size={16} style={{ marginRight: '0.5rem' }} />
            Mark All
          </button>
          <button
            onClick={() => setShowBulkMarkModal(false)}
            className="btn btn-ghost"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const renderRecordDetailModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: viewingRecord ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--background)',
        borderRadius: 'var(--radius)',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%'
      }}>
        {viewingRecord && (
          <>
            <div style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Attendance Details</span>
              <button onClick={() => setViewingRecord(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', background: 'var(--secondary)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Date</div>
                <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>
                  {new Date(viewingRecord.dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: 'var(--secondary)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                    <LogIn size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                    Punch In
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    {viewingRecord.punchInTime ? convertTimestampToDate(viewingRecord.punchInTime)?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </div>
                </div>

                <div style={{ padding: '1rem', background: 'var(--secondary)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                    <LogOut size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                    Punch Out
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    {viewingRecord.punchOutTime ? convertTimestampToDate(viewingRecord.punchOutTime)?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: 'var(--secondary)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Work Hours</div>
                  <div style={{ fontWeight: 600, fontSize: '1.25rem' }}>{viewingRecord.workHours}h</div>
                </div>

                <div style={{ padding: '1rem', background: 'var(--secondary)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Status</div>
                  <span style={{
                    background: viewingRecord.status === 'present' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: viewingRecord.status === 'present' ? '#10b981' : '#ef4444',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {viewingRecord.status}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setViewingRecord(null);
                  setEditingRecordModal({
                    ...viewingRecord,
                    originalPunchInTime: viewingRecord.punchInTime,
                    originalPunchOutTime: viewingRecord.punchOutTime,
                    originalStatus: viewingRecord.status
                  });
                }}
                className="btn btn-secondary"
                style={{ fontSize: '0.875rem' }}
              >
                <Edit2 size={14} style={{ marginRight: '0.25rem' }} />
                Edit
              </button>
              <button
                onClick={() => {
                  handleDeleteRecord(viewingRecord.id, viewingRecord);
                  setViewingRecord(null);
                }}
                className="btn btn-ghost"
                style={{ fontSize: '0.875rem', color: '#ef4444' }}
                disabled={loading}
              >
                <Trash2 size={14} style={{ marginRight: '0.25rem' }} />
                Delete
              </button>
              <button
                onClick={() => setViewingRecord(null)}
                className="btn btn-ghost"
                style={{ fontSize: '0.875rem' }}
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderEditRecordModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: editingRecordModal ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--background)',
        borderRadius: 'var(--radius)',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%'
      }}>
        {editingRecordModal && (
          <>
            <div style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Edit Attendance Record</span>
              <button onClick={() => setEditingRecordModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="label" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Date</label>
              <input
                type="date"
                className="input"
                disabled
                value={editingRecordModal.dateStr}
                style={{ width: '100%', opacity: 0.6 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="label" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                  <LogIn size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                  Punch In Time
                </label>
                <input
                  type="time"
                  className="input"
                  value={editingRecordModal.punchInTime ? convertTimestampToDate(editingRecordModal.punchInTime)?.toTimeString().slice(0, 5) : '09:00'}
                  onChange={(e) => setEditingRecordModal({
                    ...editingRecordModal,
                    punchInTime: new Date(editingRecordModal.dateStr + 'T' + e.target.value)
                  })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="label" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                  <LogOut size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                  Punch Out Time
                </label>
                <input
                  type="time"
                  className="input"
                  value={editingRecordModal.punchOutTime ? convertTimestampToDate(editingRecordModal.punchOutTime)?.toTimeString().slice(0, 5) : '17:00'}
                  onChange={(e) => setEditingRecordModal({
                    ...editingRecordModal,
                    punchOutTime: new Date(editingRecordModal.dateStr + 'T' + e.target.value)
                  })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Status</label>
              <select
                className="input"
                value={editingRecordModal.status}
                onChange={(e) => setEditingRecordModal({
                  ...editingRecordModal,
                  status: e.target.value
                })}
                style={{ width: '100%' }}
              >
                <option value="present">✓ Present</option>
                <option value="absent">✗ Absent</option>
                <option value="leave">📋 Leave</option>
                <option value="half-day">◐ Half Day</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                onClick={handleSaveEditingRecord}
                className="btn btn-success"
                disabled={loading}
                style={{ opacity: loading ? 0.5 : 1 }}
              >
                <Save size={16} style={{ marginRight: '0.5rem' }} />
                Save Changes
              </button>
              <button
                onClick={() => setEditingRecordModal(null)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
  return (
    <div style={{ padding: '0' }}>
      {/* Top Header with Month Navigation */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, rgba(139, 92, 246, 0.8) 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: 'var(--radius)',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>Staff Attendance</h1>
          <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0' }}>Track and manage staff attendance records</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="month"
            value={monthYear}
            onChange={(e) => setMonthYear(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
          />
        </div>
      </div>

      {/* View Mode Tabs */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.75rem', borderBottom: '2px solid var(--border)', paddingBottom: '1rem' }}>
        <button
          onClick={() => setViewMode('calendar')}
          className="btn"
          style={{
            background: viewMode === 'calendar' ? 'var(--primary)' : 'transparent',
            color: viewMode === 'calendar' ? 'white' : 'var(--muted-foreground)',
            border: viewMode === 'calendar' ? 'none' : '1px solid var(--border)',
            padding: '0.75rem 1.5rem',
            fontWeight: viewMode === 'calendar' ? '600' : '500',
            transition: 'all 0.2s ease'
          }}
        >
          <Calendar size={18} style={{ marginRight: '0.5rem' }} />
          Calendar View
        </button>
        <button
          onClick={() => setViewMode('individual')}
          className="btn"
          style={{
            background: viewMode === 'individual' ? 'var(--primary)' : 'transparent',
            color: viewMode === 'individual' ? 'white' : 'var(--muted-foreground)',
            border: viewMode === 'individual' ? 'none' : '1px solid var(--border)',
            padding: '0.75rem 1.5rem',
            fontWeight: viewMode === 'individual' ? '600' : '500',
            transition: 'all 0.2s ease'
          }}
        >
          <Clock size={18} style={{ marginRight: '0.5rem' }} />
          Punch Records
        </button>
        <button
          onClick={() => { setViewMode('overview'); loadOverviewStats(); }}
          className="btn"
          style={{
            background: viewMode === 'overview' ? 'var(--primary)' : 'transparent',
            color: viewMode === 'overview' ? 'white' : 'var(--muted-foreground)',
            border: viewMode === 'overview' ? 'none' : '1px solid var(--border)',
            padding: '0.75rem 1.5rem',
            fontWeight: viewMode === 'overview' ? '600' : '500',
            transition: 'all 0.2s ease'
          }}
        >
          <Users size={18} style={{ marginRight: '0.5rem' }} />
          All Staff
        </button>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem', alignItems: 'start' }}>
          {renderStaffList()}
          <div>
            {selectedStaff && renderCalendarView()}
          </div>
        </div>
      )}

      {/* Individual View */}
      {viewMode === 'individual' && (
        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem', alignItems: 'start' }}>
          {renderStaffList()}
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {selectedStaff && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {renderPunchCard()}
                  {renderStatsCard()}
                </div>
                {renderAttendanceRecords()}
              </>
            )}
          </div>
        </div>
      )}

      {/* Overview View */}
      {viewMode === 'overview' && renderOverviewTable()}

      {/* Alerts */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          background: '#ef4444',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius)',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          maxWidth: '400px',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          background: '#10b981',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius)',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          maxWidth: '400px',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease'
        }}>
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Modals */}
      {renderManualMarkModal()}
      {renderBulkMarkModal()}
      {renderRecordDetailModal()}
      {renderEditRecordModal()}

      {/* Loading Spinner */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--background)',
            padding: '2.5rem',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ marginBottom: '1.5rem', fontWeight: '600', color: 'var(--muted-foreground)' }}>Loading...</div>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid var(--secondary)',
              borderTop: '4px solid var(--primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Attendance;
