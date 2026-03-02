import React, { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  ArrowRight,
  Gift,
  Calendar,
  TrendingUp,
  Settings,
  Save,
  Clock,
  ExternalLink,
  Search,
  History as HistoryIcon,
} from "lucide-react";
import {
  getAllReferrals,
  getReferralSettings,
  updateReferralSettings,
  getLatestVisitForCustomer,
} from "../utils/referralUtils";
import { convertTimestampToDate } from "../utils/firebaseUtils";

const Referrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [settings, setSettings] = useState({
    pointsPerRupee: 1.0,
    redemptionRate: 20,
    referrerRewardType: "match_referee",
  });
  const [loading, setLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [referralsData, settingsData] = await Promise.all([
        getAllReferrals(),
        getReferralSettings(),
      ]);

      // For each referral, fetch the latest visit for the referee
      const enrichedReferrals = await Promise.all(
        referralsData.map(async (ref) => {
          if (ref.status === "completed") {
            const latestVisit = await getLatestVisitForCustomer(
              ref.newCustomerPhone,
            );
            return { ...ref, latestVisit };
          }
          return ref;
        }),
      );

      setReferrals(enrichedReferrals);
      if (settingsData) setSettings(settingsData);
    } catch (err) {
      console.error("Error fetching referal data:", err);
      setError("Failed to load referral information");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      setIsSavingSettings(true);
      await updateReferralSettings(settings);
      setSuccess("Referral settings updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const filteredReferrals = referrals.filter(
    (ref) =>
      ref.referrerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.newCustomerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.referrerPhone?.includes(searchQuery) ||
      ref.newCustomerPhone?.includes(searchQuery),
  );

  if (loading)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading referral system...
      </div>
    );

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">🤝 Referrals & Points</h1>
          <p className="text-muted-foreground mt-1">
            Manage guest referrals and loyalty points settings
          </p>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <input
              type="text"
              placeholder="Search referrals..."
              className="input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div
          className="p-4 rounded-lg mb-6 border"
          style={{
            background: "var(--admin-danger-light)",
            border: "1px solid var(--admin-danger)",
            color: "var(--admin-danger)",
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="p-4 rounded-lg mb-6 border"
          style={{
            background: "var(--admin-success-light)",
            border: "1px solid var(--admin-success)",
            color: "var(--admin-success)",
          }}
        >
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Statistics Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-6 border-none shadow-sm">
              <div className="flex items-center gap-4">
                <div
                  className="p-3 rounded-lg bg-amber-500/10 text-amber-600"
                  style={{
                    background: "var(--admin-primary-light)",
                    color: "var(--admin-primary-dark)",
                    opacity: 0.2,
                  }}
                >
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Referrals
                  </p>
                  <p className="text-2xl font-bold">{referrals.length}</p>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div
                  className="p-3 rounded-lg bg-green-500/10 text-green-600"
                  style={{
                    background: "var(--admin-success-light)",
                    color: "var(--admin-success)",
                  }}
                >
                  <UserCheck size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Converted</p>
                  <p className="text-2xl font-bold">
                    {referrals.filter((r) => r.status === "completed").length}
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div
                  className="p-3 rounded-lg bg-yellow-500/10 text-yellow-600"
                  style={{
                    background: "var(--admin-warning-light)",
                    color: "var(--admin-warning)",
                  }}
                >
                  <Gift size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Points Gained</p>
                  <p className="text-2xl font-bold">
                    {referrals.reduce(
                      (acc, r) => acc + (r.pointsAwardedToReferrer || 0),
                      0,
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Referrals List */}
          <div className="card shadow-sm border-none overflow-hidden">
            <div className="p-6 border-b border-muted/20">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <HistoryIcon className="text-amber-600" size={20} />
                Referral History
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#f8fafc] text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Referrer (A)</th>
                    <th className="px-6 py-4 text-center">
                      <ArrowRight size={14} className="inline mr-1" />
                    </th>
                    <th className="px-6 py-4">New Guest (B)</th>
                    <th className="px-6 py-4">Last Visit & Service</th>
                    <th className="px-6 py-4">Points</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReferrals.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-sm">
                          {item.referrerName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.referrerPhone}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <ArrowRight
                          size={16}
                          className="text-muted-foreground inline"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-sm">
                          {item.newCustomerName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.newCustomerPhone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {item.latestVisit ? (
                          <>
                            <div className="text-xs font-medium">
                              {new Date(
                                convertTimestampToDate(item.latestVisit.date),
                              ).toLocaleDateString()}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                              {item.latestVisit.items?.[0]?.name ||
                                "Service visit"}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-amber-600 font-bold text-sm">
                          <TrendingUp size={14} />
                          {item.pointsAwardedToReferrer || 0}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-tight">
                          Match spend
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            item.status === "completed"
                              ? "bg-green-100/50 text-green-700"
                              : "bg-amber-100/50 text-amber-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredReferrals.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-12 text-center text-muted-foreground"
                      >
                        No referrals found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Global Settings Side Panel */}
        <div>
          <div className="card p-6 sticky top-6 border-none shadow-sm">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
              <Settings className="text-amber-600" size={20} />
              Points Settings
            </h2>

            <form onSubmit={handleUpdateSettings} className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Referrer Gain Logic
                </label>
                <div className="p-4 bg-muted/50 rounded-lg text-sm italic text-muted-foreground mb-3">
                  "If A refers B, then A gets same points as B spends"
                </div>
                <select
                  className="input"
                  value={settings.referrerRewardType}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      referrerRewardType: e.target.value,
                    })
                  }
                >
                  <option value="match_referee">
                    Match Referee Spend (1:1)
                  </option>
                  <option value="fixed_amount">
                    Fixed Points (e.g. 500 pts)
                  </option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Points per Rupee (Earn)
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      step="0.1"
                      className="input text-center"
                      value={settings.pointsPerRupee}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pointsPerRupee: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <span className="text-muted-foreground font-medium">
                    pts / ₹1
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Example: 1.0 means ₹100 spend = 100 points
                </p>
              </div>

              <div className="pt-4 border-t">
                <label className="text-sm font-medium mb-2 block">
                  Redemption Value (Spend)
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      className="input text-center"
                      value={settings.redemptionRate}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          redemptionRate: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <span className="text-muted-foreground font-medium">
                    pts = ₹1
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Example: 20 means 2000 points = ₹100 discount
                </p>
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className="btn btn-primary w-full py-3 flex items-center justify-center gap-2"
                style={{
                  background: "var(--admin-primary-gradient)",
                  border: "none",
                }}
              >
                {isSavingSettings ? (
                  "Saving..."
                ) : (
                  <>
                    <Save size={18} /> Save Configurations
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h3 className="text-xs font-bold uppercase text-primary mb-2 flex items-center gap-1">
                <Clock size={14} /> Quick Note
              </h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                These settings are used globally across the reception billing
                panel to calculate member discounts. Change with caution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referrals;
