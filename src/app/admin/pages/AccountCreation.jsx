import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../../../firebaseConfig";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import {
  User,
  Mail,
  Lock,
  Shield,
  Trash2,
  UserPlus,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const AccountCreation = () => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("receptionist");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [fetchingUsers, setFetchingUsers] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setFetchingUsers(true);
      const querySnapshot = await getDocs(collection(db, "users"));
      const userData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(userData);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Note: In an actual production app, creating another user's account
      // from an existing admin session is usually done via a Firebase Admin SDK
      // (Cloud Function) to avoid logging out the current admin.
      // This implementation assumes the standard client-side creation.
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      await updateProfile(userCredential.user, { displayName });

      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: userCredential.user.email,
        displayName: displayName,
        role: role,
        createdAt: serverTimestamp(),
      });

      setSuccess(`Account for ${displayName} created successfully as ${role}!`);
      setDisplayName("");
      setEmail("");
      setPassword("");
      fetchUsers();
    } catch (err) {
      console.error("Error creating account:", err);
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This will only remove their Firestore profile.",
      )
    )
      return;

    try {
      await deleteDoc(doc(db, "users", userId));
      setSuccess("User profile removed successfully");
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete user profile");
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>
          🔐 Account Management
        </h1>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}
      >
        {/* Create Account Form */}
        <div className="card">
          <div className="card-header">
            <h2
              className="card-title"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <UserPlus size={20} />
              Create New Account
            </h2>
          </div>
          <div className="card-content">
            {error && (
              <div
                style={{
                  padding: "1rem",
                  marginBottom: "1rem",
                  backgroundColor: "var(--admin-danger-light)",
                  border: "1px solid var(--admin-danger)",
                  borderRadius: "var(--admin-radius-sm)",
                  color: "var(--admin-danger)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <AlertCircle size={18} /> {error}
              </div>
            )}
            {success && (
              <div
                style={{
                  padding: "1rem",
                  marginBottom: "1rem",
                  backgroundColor: "var(--admin-success-light)",
                  border: "1px solid var(--admin-success)",
                  borderRadius: "var(--admin-radius-sm)",
                  color: "var(--admin-success)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <CheckCircle size={18} /> {success}
              </div>
            )}

            <form
              onSubmit={handleCreateAccount}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div className="form-group">
                <label className="label">Display Name</label>
                <div className="input-group">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    className="input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Full Name"
                    required
                    style={{ paddingLeft: "2.5rem" }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Email Address</label>
                <div className="input-group">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    style={{ paddingLeft: "2.5rem" }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Password</label>
                <div className="input-group">
                  <Lock size={18} className="input-icon" />
                  <input
                    type="password"
                    className="input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                    style={{ paddingLeft: "2.5rem" }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Staff Role</label>
                <div className="input-group">
                  <Shield size={18} className="input-icon" />
                  <select
                    className="input"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ paddingLeft: "2.5rem" }}
                  >
                    <option value="receptionist">Receptionist</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{
                  marginTop: "1rem",
                  background: "var(--admin-primary-gradient)",
                  borderColor: "transparent",
                }}
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>
          </div>
        </div>

        {/* Existing Accounts List */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Existing Team Accounts</h2>
          </div>
          <div className="card-content">
            {fetchingUsers ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <div
                  className="loading-spinner"
                  style={{
                    margin: "0 auto",
                    borderColor:
                      "var(--admin-primary) transparent var(--admin-primary) transparent",
                  }}
                ></div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {users.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1rem",
                      backgroundColor: "var(--admin-muted)",
                      borderRadius: "var(--admin-radius-sm)",
                      border: "1px solid var(--admin-border-light)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "var(--admin-foreground)",
                        }}
                      >
                        {u.displayName || "Unnamed User"}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--admin-muted-foreground)",
                        }}
                      >
                        {u.email}
                      </div>
                      <div
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "0.7rem",
                          marginTop: "4px",
                          background:
                            u.role === "admin"
                              ? "var(--admin-success-light)"
                              : "var(--admin-secondary)",
                          color:
                            u.role === "admin"
                              ? "var(--admin-success)"
                              : "var(--admin-secondary-foreground)",
                        }}
                      >
                        {u.role?.toUpperCase()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      style={{
                        color: "var(--admin-danger)",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountCreation;
