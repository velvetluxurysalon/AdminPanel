import { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle,
  Loader,
  BarChart3,
  Calendar,
} from "lucide-react";
import {
  getStaff,
  punchInStaff,
  punchOutStaff,
  getTodayPunchStatus,
  getStaffAttendance,
} from "../utils/firebaseUtils";

const Attendance = () => {
  const [staff, setStaff] = useState([]);
  const [punchStatus, setPunchStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentTab, setCurrentTab] = useState("punch"); // "punch" or "analytics"
  const [analyticsMonth, setAnalyticsMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [analyticsData, setAnalyticsData] = useState({});
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [liveWorkHours, setLiveWorkHours] = useState({});
  const [expandedStaff, setExpandedStaff] = useState({});

  // Load staff and their punch status once
  useEffect(() => {
    loadData();
    const interval = setInterval(refreshPunchStatus, 30000);
    const liveWorkhourInterval = setInterval(updateLiveWorkHours, 5000); // Update live work hours every 5s
    return () => {
      clearInterval(interval);
      clearInterval(liveWorkhourInterval);
    };
  }, []);

  // Update live work hours for punched in staff
  const updateLiveWorkHours = () => {
    const newLiveWorkHours = {};
    staff.forEach((staffMember) => {
      const status = punchStatus[staffMember.id];
      if (status?.record?.cycles && status.record.cycles.length > 0) {
        try {
          const cycles = status.record.cycles;
          let totalHours = 0;

          // Sum all completed cycles
          cycles.forEach((cycle) => {
            if (cycle.workHours) {
              totalHours += cycle.workHours;
            }
          });

          // Add live hours for the current active cycle (if punched in)
          const lastCycle = cycles[cycles.length - 1];
          if (lastCycle?.punchInTime && !lastCycle?.punchOutTime) {
            const punchInDate =
              lastCycle.punchInTime?.toDate?.() ||
              new Date(lastCycle.punchInTime);
            const now = new Date();
            const diffMs = now - punchInDate;
            const diffHours = diffMs / (1000 * 60 * 60);
            totalHours += diffHours;
          }

          newLiveWorkHours[staffMember.id] = parseFloat(totalHours.toFixed(2));
        } catch (e) {
          newLiveWorkHours[staffMember.id] = status.record?.workHours || 0;
        }
      }
    });
    setLiveWorkHours(newLiveWorkHours);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // Load all staff
      const staffList = await getStaff(false);
      setStaff(staffList);

      // Load punch status in parallel
      const statusMap = {};
      await Promise.all(
        staffList.map(async (staffMember) => {
          try {
            const status = await getTodayPunchStatus(
              staffMember.id,
              staffMember.name,
            );
            // Map the response properly
            statusMap[staffMember.id] = {
              hasPunchedIn: status?.hasPunchedIn || false,
              hasPunchedOut: status?.hasPunchedOut || false,
              record: status?.record || null,
              punchInTime: status?.record?.punchInTime || null,
              workHours: status?.record?.workHours || 0,
            };
          } catch (err) {
            console.error(
              `Error loading punch status for ${staffMember.name}:`,
              err,
            );
            statusMap[staffMember.id] = {
              hasPunchedIn: false,
              hasPunchedOut: false,
              record: null,
              punchInTime: null,
              workHours: 0,
            };
          }
        }),
      );

      setPunchStatus(statusMap);
      updateLiveWorkHours();
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load staff data");
    } finally {
      setLoading(false);
    }
  };

  const refreshPunchStatus = async () => {
    try {
      const statusMap = {};
      await Promise.all(
        staff.map(async (staffMember) => {
          try {
            const status = await getTodayPunchStatus(
              staffMember.id,
              staffMember.name,
            );
            statusMap[staffMember.id] = {
              hasPunchedIn: status?.hasPunchedIn || false,
              hasPunchedOut: status?.hasPunchedOut || false,
              record: status?.record || null,
              punchInTime: status?.record?.punchInTime || null,
              workHours: status?.record?.workHours || 0,
            };
          } catch (err) {
            statusMap[staffMember.id] = punchStatus[staffMember.id] || {
              hasPunchedIn: false,
              hasPunchedOut: false,
              record: null,
              punchInTime: null,
              workHours: 0,
            };
          }
        }),
      );
      setPunchStatus(statusMap);
      updateLiveWorkHours();
    } catch (err) {
      console.error("Error refreshing punch status:", err);
    }
  };

  const handleTogglePunch = async (staffMember) => {
    try {
      setTogglingId(staffMember.id);
      setError("");
      const currentStatus = punchStatus[staffMember.id];
      const hasPunchedIn = currentStatus?.hasPunchedIn;
      const hasPunchedOut = currentStatus?.hasPunchedOut;

      // If punched in and not punched out yet, punch them out
      if (hasPunchedIn && !hasPunchedOut) {
        await punchOutStaff(staffMember.id, staffMember.name);
        setSuccess(`${staffMember.name} punched out!`);
      }
      // If not punched in or already punched out, punch them in
      else if (!hasPunchedIn || hasPunchedOut) {
        await punchInStaff(staffMember.id, staffMember.name);
        setSuccess(`${staffMember.name} punched in!`);
      }

      // Refresh this staff's punch status
      const newStatus = await getTodayPunchStatus(
        staffMember.id,
        staffMember.name,
      );
      setPunchStatus((prev) => ({
        ...prev,
        [staffMember.id]: {
          hasPunchedIn: newStatus?.hasPunchedIn || false,
          hasPunchedOut: newStatus?.hasPunchedOut || false,
          record: newStatus?.record || null,
          punchInTime: newStatus?.record?.punchInTime || null,
          workHours: newStatus?.record?.workHours || 0,
        },
      }));

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error toggling punch:", err);
      // Handle the specific error about already punching in
      const errorMsg = err.message || "Failed to toggle punch";
      if (errorMsg.includes("already punched in")) {
        setError("Already punched in today. Use the toggle to punch out.");
      } else {
        setError(errorMsg);
      }
      setTimeout(() => setError(""), 4000);
    } finally {
      setTogglingId(null);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "-";
    try {
      const date = timestamp?.toDate?.() || new Date(timestamp);
      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "-";
    }
  };

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const data = {};

      await Promise.all(
        staff.map(async (staffMember) => {
          try {
            const attendance = await getStaffAttendance(
              staffMember.name,
              analyticsMonth,
              staffMember.id,
            );
            data[staffMember.id] = {
              name: staffMember.name,
              position: staffMember.position,
              attendance: attendance || {},
            };
          } catch (err) {
            console.error(
              `Error loading analytics for ${staffMember.name}:`,
              err,
            );
            data[staffMember.id] = {
              name: staffMember.name,
              position: staffMember.position,
              attendance: {},
            };
          }
        }),
      );

      setAnalyticsData(data);
    } catch (err) {
      console.error("Error loading analytics:", err);
      setError("Failed to load analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (currentTab === "analytics" && Object.keys(analyticsData).length === 0) {
      loadAnalytics();
    }
  }, [currentTab, analyticsMonth]);

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div style={{ marginBottom: "1rem", color: "var(--muted-foreground)" }}>
          Loading staff...
        </div>
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "4px solid var(--secondary)",
            borderTop: "4px solid var(--primary)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto",
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "0" }}>
      {/* Header with Tabs */}
      <div
        style={{
          background:
            "linear-gradient(135deg, var(--primary) 0%, rgba(139, 92, 246, 0.8) 100%)",
          color: "white",
          padding: "2rem",
          borderRadius: "var(--radius)",
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: "700",
              margin: "0 0 1rem 0",
            }}
          >
            Staff Attendance
          </h1>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={() => setCurrentTab("punch")}
              style={{
                padding: "0.5rem 1.5rem",
                background:
                  currentTab === "punch"
                    ? "rgba(255,255,255,0.25)"
                    : "transparent",
                border: "1px solid rgba(255,255,255,0.5)",
                color: "white",
                borderRadius: "6px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              Punch In/Out
            </button>
            <button
              onClick={() => setCurrentTab("analytics")}
              style={{
                padding: "0.5rem 1.5rem",
                background:
                  currentTab === "analytics"
                    ? "rgba(255,255,255,0.25)"
                    : "transparent",
                border: "1px solid rgba(255,255,255,0.5)",
                color: "white",
                borderRadius: "6px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <BarChart3 size={18} />
              Analytics
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            if (currentTab === "punch") {
              refreshPunchStatus();
            } else {
              loadAnalytics();
            }
          }}
          className="btn btn-secondary"
          style={{ padding: "0.75rem 1.5rem", fontWeight: "600" }}
        >
          {analyticsLoading && currentTab === "analytics"
            ? "Loading..."
            : "Refresh"}
        </button>
      </div>

      {/* Punch Tab */}
      {currentTab === "punch" && (
        <div
          style={{
            background: "white",
            borderRadius: "var(--radius)",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* List Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 0.5fr",
              gap: "1rem",
              padding: "1rem 1.5rem",
              background: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
              fontWeight: "700",
              fontSize: "0.875rem",
              color: "var(--muted-foreground)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            <div>Staff Name</div>
            <div>Position</div>
            <div>Punch In Time</div>
            <div>Working Hours</div>
            <div>Status</div>
            <div style={{ textAlign: "center" }}>Toggle</div>
          </div>

          {/* List Items */}
          {staff.map((staffMember) => {
            const status = punchStatus[staffMember.id];
            const hasPunchedIn = status?.hasPunchedIn;
            const hasPunchedOut = status?.hasPunchedOut;
            const punchInTime = formatTime(status?.punchInTime);
            const workHours =
              liveWorkHours[staffMember.id] || status?.workHours || 0;
            const isToggling = togglingId === staffMember.id;

            return (
              <div
                key={staffMember.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 0.5fr",
                  gap: "1rem",
                  padding: "1.25rem 1.5rem",
                  borderBottom: "1px solid #f3f4f6",
                  alignItems: "center",
                  transition: "background-color 0.2s ease",
                  background:
                    hasPunchedIn && !hasPunchedOut
                      ? "rgba(16, 185, 129, 0.04)"
                      : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isToggling) {
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    hasPunchedIn && !hasPunchedOut
                      ? "rgba(16, 185, 129, 0.04)"
                      : "transparent";
                }}
              >
                {/* Staff Name */}
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: "700",
                    color: "var(--foreground)",
                  }}
                >
                  {staffMember.name}
                </div>

                {/* Position */}
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--muted-foreground)",
                  }}
                >
                  {staffMember.position || "Staff Member"}
                </div>

                {/* Punch In Time */}
                <div
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color:
                      hasPunchedIn && !hasPunchedOut
                        ? "#10b981"
                        : "var(--muted-foreground)",
                  }}
                >
                  {punchInTime}
                </div>

                {/* Working Hours - Live Updated */}
                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: "700",
                    color: "var(--primary)",
                  }}
                >
                  {workHours.toFixed(2)}h
                </div>

                {/* Status Badge */}
                <div
                  style={{
                    padding: "0.4rem 0.8rem",
                    borderRadius: "6px",
                    background:
                      hasPunchedIn && !hasPunchedOut
                        ? "#10b98133"
                        : "#6b7280aa",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    color:
                      hasPunchedIn && !hasPunchedOut ? "#10b981" : "#f3f4f6",
                    textAlign: "center",
                  }}
                >
                  {hasPunchedIn && !hasPunchedOut ? "IN" : "OUT"}
                </div>

                {/* Toggle Switch */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <label
                    style={{
                      position: "relative",
                      display: "inline-flex",
                      alignItems: "center",
                      cursor: isToggling ? "not-allowed" : "pointer",
                      opacity: isToggling ? 0.6 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={hasPunchedIn && !hasPunchedOut}
                      onChange={() => handleTogglePunch(staffMember)}
                      disabled={isToggling}
                      style={{ display: "none" }}
                    />
                    <div
                      style={{
                        width: "56px",
                        height: "32px",
                        background:
                          hasPunchedIn && !hasPunchedOut
                            ? "#10b981"
                            : "#d1d5db",
                        borderRadius: "999px",
                        position: "relative",
                        transition: "background-color 0.3s ease",
                        border: "2px solid transparent",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: hasPunchedIn && !hasPunchedOut ? "28px" : "4px",
                          transform: "translateY(-50%)",
                          width: "24px",
                          height: "24px",
                          background: "white",
                          borderRadius: "50%",
                          transition: "left 0.3s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                        }}
                      >
                        {isToggling && (
                          <div
                            style={{
                              width: "14px",
                              height: "14px",
                              border: "2px solid #10b981",
                              borderTop: "2px solid transparent",
                              borderRadius: "50%",
                              animation: "spin 0.8s linear infinite",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Analytics Tab */}
      {currentTab === "analytics" && (
        <div
          style={{
            background: "white",
            borderRadius: "var(--radius)",
            padding: "2rem",
          }}
        >
          {/* Month Selector */}
          <div style={{ marginBottom: "2rem" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <Calendar size={20} style={{ color: "var(--primary)" }} />
              <span style={{ fontWeight: "600" }}>Select Month:</span>
              <input
                type="month"
                value={analyticsMonth}
                onChange={(e) => setAnalyticsMonth(e.target.value)}
                style={{
                  padding: "0.5rem 1rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  fontSize: "0.95rem",
                }}
              />
            </label>
          </div>

          {analyticsLoading ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  border: "4px solid var(--secondary)",
                  borderTop: "4px solid var(--primary)",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {staff.map((staffMember) => {
                const staffData = analyticsData[staffMember.id];
                if (!staffData) return null;

                // Calculate total working hours for the month
                const totalWorkHours = Object.values(
                  staffData.attendance,
                ).reduce((sum, day) => {
                  return sum + (day.workHours || 0);
                }, 0);

                // Count present days
                const presentDays = Object.values(staffData.attendance).filter(
                  (day) => day.status === "present",
                ).length;

                return (
                  <div
                    key={staffMember.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "var(--radius)",
                      padding: "1.5rem",
                      background: "#f9fafb",
                    }}
                  >
                    <div style={{ marginBottom: "1rem" }}>
                      <h3
                        style={{
                          fontSize: "1.125rem",
                          fontWeight: "700",
                          margin: "0 0 0.25rem 0",
                        }}
                      >
                        {staffData.name}
                      </h3>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--muted-foreground)",
                          margin: "0",
                        }}
                      >
                        {staffData.position || "Staff Member"}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1rem",
                      }}
                    >
                      <div
                        style={{
                          background: "white",
                          padding: "1rem",
                          borderRadius: "6px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--muted-foreground)",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Total Work Hours
                        </div>
                        <div
                          style={{
                            fontSize: "1.75rem",
                            fontWeight: "700",
                            color: "var(--primary)",
                          }}
                        >
                          {totalWorkHours.toFixed(1)}h
                        </div>
                      </div>

                      <div
                        style={{
                          background: "white",
                          padding: "1rem",
                          borderRadius: "6px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--muted-foreground)",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Present Days
                        </div>
                        <div
                          style={{
                            fontSize: "1.75rem",
                            fontWeight: "700",
                            color: "#10b981",
                          }}
                        >
                          {presentDays}
                        </div>
                      </div>
                    </div>

                    {/* Daily breakdown */}
                    <div style={{ marginTop: "1rem" }}>
                      <h4
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: "700",
                          marginBottom: "0.75rem",
                        }}
                      >
                        Daily Breakdown:
                      </h4>
                      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                        {Object.entries(staffData.attendance)
                          .sort(([dateA], [dateB]) =>
                            dateB.localeCompare(dateA),
                          )
                          .map(([date, dayData]) => (
                            <div
                              key={date}
                              style={{
                                padding: "0.5rem",
                                fontSize: "0.8rem",
                                borderBottom: "1px solid #e5e7eb",
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <span style={{ fontWeight: "600" }}>
                                {new Date(date).toLocaleDateString()}
                              </span>
                              <span
                                style={{
                                  color: "var(--primary)",
                                  fontWeight: "700",
                                }}
                              >
                                {(dayData.workHours || 0).toFixed(2)}h
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          style={{
            position: "fixed",
            top: "1rem",
            right: "1rem",
            background: "#ef4444",
            color: "white",
            padding: "1rem 1.5rem",
            borderRadius: "var(--radius)",
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            maxWidth: "400px",
            zIndex: 1000,
            animation: "slideIn 0.3s ease",
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div
          style={{
            position: "fixed",
            top: "1rem",
            right: "1rem",
            background: "#10b981",
            color: "white",
            padding: "1rem 1.5rem",
            borderRadius: "var(--radius)",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            maxWidth: "400px",
            zIndex: 1000,
            animation: "slideIn 0.3s ease",
          }}
        >
          <CheckCircle size={18} />
          <span>{success}</span>
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
