import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    login(email, fullName || "Creator");
    navigate("/dashboard/account");
  };

  return (
    <section className="auth-wrap">
      <form className="card auth-card" onSubmit={onSubmit}>
        <h2>Login</h2>
        <label>
          Full name
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <button type="submit">Continue to Dashboard</button>
      </form>
    </section>
  );
}
