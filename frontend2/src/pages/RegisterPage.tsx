import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    register(email, name || "Creator");
    setPassword("");
    navigate("/dashboard/intelligence");
  };

  return (
    <section className="mx-auto mt-10 w-full max-w-lg px-4">
      <form onSubmit={onSubmit} className="glass-panel space-y-4 p-6">
        <h2 className="text-2xl font-semibold text-white">Register</h2>
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
        <label className="block text-sm text-slate-300">
          Password
          <input
            className="input-field"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="btn-primary w-full">
          Create Account
        </button>
      </form>
    </section>
  );
}
