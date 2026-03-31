import { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  TrendingUp,
  Briefcase,
  DollarSign,
  Filter,
  Download,
  Search,
  BarChart3,
  ChevronDown,
  X,
  CheckCircle,
  Clock,
} from "lucide-react";
import { getAllStaffWorks } from "../utils/firebaseUtils";

const StaffWorkAnalytics = () => {
  const [staffWorks, setStaffWorks] = useState([]);
  const [filteredStats, setFilteredStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [monthYear, setMonthYear] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("services"); // 'services', 'earnings', 'name'
  const [selectedStaff, setSelectedStaff] = useState(null); // Track selected staff for detail view

  useEffect(() => {
    fetchData();
  }, [monthYear]);

  useEffect(() => {
    filterAndSortStats();
  }, [staffWorks, searchTerm, sortBy]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [year, month] = monthYear.split("-");

      // Create date range for the selected month
      const startDate = new Date(year, parseInt(month) - 1, 1);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(year, parseInt(month), 0);
      endDate.setHours(23, 59, 59, 999);

      // Fetch all staff works for the selected date range
      const allWorks = await getAllStaffWorks(startDate, endDate);
      setStaffWorks(allWorks || []);
      setError("");
    } catch (err) {
      console.error("Error fetching staff works:", err);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortStats = () => {
    let filtered = staffWorks.filter((stat) =>
      stat.staffName.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // Sort based on sortBy
    if (sortBy === "earnings") {
      filtered.sort((a, b) => b.totalRevenue - a.totalRevenue);
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.staffName.localeCompare(b.staffName));
    } else {
      // default: services
      filtered.sort((a, b) => b.totalWorks - a.totalWorks);
    }

    setFilteredStats(filtered);
  };

  const downloadReport = () => {
    const csv =
      "Staff Name,Role,Total Services,Completed,Total Earnings,Avg Service Value\n" +
      filteredStats
        .map(
          (stat) =>
            `${stat.staffName},${stat.staffRole},${stat.totalWorks},${stat.completedCount},₹${stat.totalRevenue.toFixed(2)},₹${stat.averageServiceValue.toFixed(2)}`,
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `staff-work-analytics-${monthYear}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          color: "#9ca3af",
        }}
      >
        <p>Loading analytics...</p>
      </div>
    );
  }

  const statsList = filteredStats;
  const totalStaff = statsList.length;
  const totalServicesCount = statsList.reduce(
    (sum, stat) => sum + stat.totalWorks,
    0,
  );
  const totalEarningsAll = statsList.reduce(
    (sum, stat) => sum + stat.totalRevenue,
    0,
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--admin-background-gradient)",
        padding: "1.5rem",
      }}
    >
      {error && (
        <div
          style={{
            padding: "1rem",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "0.5rem",
            color: "#dc2626",
            marginBottom: "1.5rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "2rem",
              fontWeight: "700",
              color: "#111827",
            }}
          >
            Staff Work Analytics
          </h1>
          <p style={{ margin: "0.5rem 0 0 0", color: "#6b7280" }}>
            Track staff performance and earnings
          </p>
        </div>
        <button
          onClick={downloadReport}
          disabled={statsList.length === 0}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.25rem",
            background: statsList.length === 0 ? "#e5e7eb" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            fontWeight: "600",
            cursor: statsList.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          <Download size={16} /> Download Report
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "2rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: "200px" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "#6b7280",
              marginBottom: "0.5rem",
            }}
          >
            Month & Year
          </label>
          <input
            type="month"
            value={monthYear}
            onChange={(e) => setMonthYear(e.target.value)}
            style={{
              width: "100%",
              padding: "0.625rem 0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
              fontSize: "0.9375rem",
              fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: "200px" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "#6b7280",
              marginBottom: "0.5rem",
            }}
          >
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              width: "100%",
              padding: "0.625rem 0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
              fontSize: "0.9375rem",
              fontFamily: "inherit",
            }}
          >
            <option value="services">Total Services</option>
            <option value="earnings">Total Earnings</option>
            <option value="name">Staff Name</option>
          </select>
        </div>

        <div style={{ flex: 1, minWidth: "200px" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "#6b7280",
              marginBottom: "0.5rem",
            }}
          >
            Search Staff
          </label>
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af",
              }}
            />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "0.625rem 0.75rem",
                paddingLeft: "2.25rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
                fontSize: "0.9375rem",
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        {[
          {
            label: "Total Staff Active",
            value: totalStaff,
            icon: Users,
            color: "#3b82f6",
          },
          {
            label: "Total Services",
            value: totalServicesCount,
            icon: Briefcase,
            color: "#10b981",
          },
          {
            label: "Total Earnings",
            value: `₹${totalEarningsAll.toFixed(2)}`,
            icon: DollarSign,
            color: "#f59e0b",
          },
          {
            label: "Avg. per Staff",
            value:
              totalStaff > 0
                ? `₹${(totalEarningsAll / totalStaff).toFixed(2)}`
                : "₹0.00",
            icon: TrendingUp,
            color: "#8b5cf6",
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "0.75rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
                gap: "1.5rem",
              }}
            >
              <div
                style={{
                  width: "3.5rem",
                  height: "3.5rem",
                  background: `${stat.color}15`,
                  borderRadius: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={20} color={stat.color} />
              </div>
              <div>
                <p
                  style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}
                >
                  {stat.label}
                </p>
                <p
                  style={{
                    margin: "0.5rem 0 0 0",
                    fontSize: "1.75rem",
                    fontWeight: "700",
                    color: "#111827",
                  }}
                >
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Staff Details Table */}
      {statsList.length > 0 ? (
        <div
          style={{
            background: "white",
            borderRadius: "0.75rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                  }}
                >
                  <th
                    style={{
                      padding: "1rem 1.5rem",
                      textAlign: "left",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                    }}
                  >
                    Staff Name
                  </th>
                  <th
                    style={{
                      padding: "1rem 1.5rem",
                      textAlign: "left",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                    }}
                  >
                    Role
                  </th>
                  <th
                    style={{
                      padding: "1rem 1.5rem",
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                    }}
                  >
                    Services
                  </th>
                  <th
                    style={{
                      padding: "1rem 1.5rem",
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                    }}
                  >
                    Completed
                  </th>
                  <th
                    style={{
                      padding: "1rem 1.5rem",
                      textAlign: "right",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                    }}
                  >
                    Total Earnings
                  </th>
                  <th
                    style={{
                      padding: "1rem 1.5rem",
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                    }}
                  >
                    Avg Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {statsList.map((stat, index) => (
                  <tr
                    key={`${stat.staffName}-${index}`}
                    onClick={() => setSelectedStaff(stat)}
                    style={{
                      borderBottom:
                        index < statsList.length - 1
                          ? "1px solid #e5e7eb"
                          : "none",
                      cursor: "pointer",
                      background:
                        selectedStaff?.staffName === stat.staffName
                          ? "#f3f4f6"
                          : "white",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (
                        !selectedStaff ||
                        selectedStaff.staffName !== stat.staffName
                      ) {
                        e.currentTarget.style.background = "#f9fafb";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (
                        !selectedStaff ||
                        selectedStaff.staffName !== stat.staffName
                      ) {
                        e.currentTarget.style.background = "white";
                      }
                    }}
                  >
                    <td
                      style={{
                        padding: "1rem 1.5rem",
                        fontWeight: "600",
                        color: "#111827",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <ChevronDown
                          size={16}
                          style={{
                            transform:
                              selectedStaff?.staffName === stat.staffName
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                            transition: "transform 0.2s",
                          }}
                        />
                        {stat.staffName}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "1rem 1.5rem",
                        color: "#6b7280",
                        fontSize: "0.875rem",
                      }}
                    >
                      {stat.staffRole}
                    </td>
                    <td
                      style={{
                        padding: "1rem 1.5rem",
                        textAlign: "center",
                        color: "#111827",
                        fontWeight: "600",
                      }}
                    >
                      <span
                        style={{
                          background: "#dbeafe",
                          color: "#1e40af",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "9999px",
                          fontSize: "0.875rem",
                        }}
                      >
                        {stat.totalWorks}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "1rem 1.5rem",
                        textAlign: "center",
                        color: "#111827",
                        fontWeight: "600",
                      }}
                    >
                      <span
                        style={{
                          background: "#e0e7ff",
                          color: "#5b21b6",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "9999px",
                          fontSize: "0.875rem",
                        }}
                      >
                        {stat.completedCount}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "1rem 1.5rem",
                        textAlign: "right",
                        color: "#059669",
                        fontWeight: "700",
                      }}
                    >
                      ₹{stat.totalRevenue.toFixed(2)}
                    </td>
                    <td
                      style={{
                        padding: "1rem 1.5rem",
                        textAlign: "center",
                        color: "#6b7280",
                        fontSize: "0.875rem",
                      }}
                    >
                      ₹{stat.averageServiceValue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "white",
            padding: "3rem",
            borderRadius: "0.75rem",
            textAlign: "center",
            color: "#9ca3af",
          }}
        >
          <BarChart3
            size={48}
            style={{ margin: "0 auto 1rem", opacity: 0.5 }}
          />
          <p>No staff work data available for the selected period</p>
        </div>
      )}

      {/* Staff Work Details Panel */}
      {selectedStaff && (
        <div
          style={{
            marginTop: "2rem",
            background: "white",
            borderRadius: "0.75rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          {/* Panel Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1.5rem",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "700" }}>
                {selectedStaff.staffName}
              </h2>
              <p style={{ margin: "0.25rem 0 0 0", opacity: 0.9 }}>
                {selectedStaff.staffRole}
              </p>
            </div>
            <button
              onClick={() => setSelectedStaff(null)}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "0.5rem",
                padding: "0.5rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} color="white" />
            </button>
          </div>

          {/* Works List */}
          <div style={{ padding: "1.5rem" }}>
            {selectedStaff.works && selectedStaff.works.length > 0 ? (
              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  {selectedStaff.works.map((work, idx) => (
                    <div
                      key={`${work.id || idx}`}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "0.5rem",
                        padding: "1rem",
                        background:
                          work.status === "completed" ? "#f0fdf4" : "#fffbeb",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow =
                          "0 4px 6px rgba(0,0,0,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {/* Status Badge */}
                      <div style={{ marginBottom: "0.75rem" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            padding: "0.25rem 0.75rem",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            background:
                              work.status === "completed"
                                ? "#dcfce7"
                                : "#fef3c7",
                            color:
                              work.status === "completed"
                                ? "#166534"
                                : "#92400e",
                          }}
                        >
                          {work.status === "completed" ? (
                            <CheckCircle size={12} />
                          ) : (
                            <Clock size={12} />
                          )}
                          {work.status.charAt(0).toUpperCase() +
                            work.status.slice(1)}
                        </span>
                      </div>

                      {/* Service Name */}
                      <h3
                        style={{
                          margin: "0 0 0.5rem 0",
                          fontSize: "0.95rem",
                          fontWeight: "700",
                          color: "#111827",
                        }}
                      >
                        {work.serviceName}
                      </h3>

                      {/* Work Details */}
                      <div
                        style={{
                          fontSize: "0.875rem",
                          color: "#6b7280",
                          marginBottom: "0.75rem",
                        }}
                      >
                        {/* Date */}
                        {work.addedAt && (
                          <div style={{ marginBottom: "0.5rem" }}>
                            <span style={{ fontWeight: "600" }}>Date:</span>{" "}
                            {new Date(
                              work.addedAt?.toDate?.() || work.addedAt,
                            ).toLocaleDateString()}{" "}
                            at{" "}
                            {new Date(
                              work.addedAt?.toDate?.() || work.addedAt,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        )}

                        {/* Customer */}
                        <div style={{ marginBottom: "0.5rem" }}>
                          <span style={{ fontWeight: "600" }}>Customer:</span>{" "}
                          {work.customerId || "N/A"}
                        </div>

                        {/* Price & Duration */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: "600" }}>Price:</span>{" "}
                            <span
                              style={{ color: "#059669", fontWeight: "700" }}
                            >
                              ₹{(work.price || 0).toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span style={{ fontWeight: "600" }}>Duration:</span>{" "}
                            {work.duration ? `${work.duration} min` : "N/A"}
                          </div>
                        </div>

                        {/* Invoice ID */}
                        {work.invoiceId && (
                          <div style={{ marginTop: "0.5rem" }}>
                            <span style={{ fontWeight: "600" }}>Invoice:</span>{" "}
                            <span
                              style={{
                                background: "#e0e7ff",
                                padding: "0.2rem 0.5rem",
                                borderRadius: "0.25rem",
                                fontSize: "0.8rem",
                              }}
                            >
                              {work.invoiceId}
                            </span>
                          </div>
                        )}

                        {/* Completion Time */}
                        {work.completedAt && (
                          <div
                            style={{ marginTop: "0.5rem", color: "#059669" }}
                          >
                            <span style={{ fontWeight: "600" }}>
                              Completed:
                            </span>{" "}
                            {new Date(
                              work.completedAt?.toDate?.() || work.completedAt,
                            ).toLocaleDateString()}{" "}
                            at{" "}
                            {new Date(
                              work.completedAt?.toDate?.() || work.completedAt,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "#9ca3af" }}>
                <p>No work records available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffWorkAnalytics;
