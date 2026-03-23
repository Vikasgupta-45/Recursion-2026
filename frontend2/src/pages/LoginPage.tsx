import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    login(email, name || "Creator");
    navigate("/dashboard/intelligence");
  };

  return (
    <section className="mx-auto mt-10 w-full max-w-lg px-4">
      <form onSubmit={onSubmit} className="glass-panel space-y-4 p-6">
        <h2 className="text-2xl font-semibold text-white">Login</h2>
        <label className="block text-sm text-slate-300">
          Full Name
          <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="block text-sm text-slate-300">
          Email
          <input
            className="input-field"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="btn-primary w-full">
          Enter Dashboard
        </button>
      </form>
    </section>
  );
}
