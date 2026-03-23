import { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import type { Platform } from "../../types";

export function AccountPage() {
  const { profile, updateProfile } = useAuth();
  const [form, setForm] = useState(profile);

  const canSave = useMemo(
    () => form.name.trim() && form.email.trim() && form.phone.trim(),
    [form],
  );

  const addLink = () => {
    setForm((prev) => ({
      ...prev,
      links: [...prev.links, { id: crypto.randomUUID(), platform: "YouTube", url: "" }],
    }));
  };

  const updateLink = (id: string, key: "platform" | "url", value: string) => {
    setForm((prev) => ({
      ...prev,
      links: prev.links.map((link) =>
        link.id === id
          ? {
              ...link,
              [key]: key === "platform" ? (value as Platform) : value,
            }
          : link,
      ),
    }));
  };

  const removeLink = (id: string) => {
    setForm((prev) => ({ ...prev, links: prev.links.filter((link) => link.id !== id) }));
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    updateProfile(form);
  };

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>Account Management</h2>
      <p className="muted">Fill your profile and add any social channel links.</p>
      <div className="form-grid">
        <label>
          Name
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>
        <label>
          Age
          <input
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </label>
        <label>
          Phone no
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
        </label>
      </div>

      <div className="links-block">
        <div className="title-row">
          <h3>Social Links</h3>
          <button type="button" className="ghost-btn" onClick={addLink}>
            Add new link
          </button>
        </div>
        {form.links.length === 0 && <p className="muted">No links yet. Add YouTube/Instagram.</p>}
        {form.links.map((link) => (
          <div key={link.id} className="link-row">
            <select
              value={link.platform}
              onChange={(e) => updateLink(link.id, "platform", e.target.value)}
            >
              <option value="YouTube">YouTube</option>
              <option value="Instagram">Instagram</option>
            </select>
            <input
              placeholder="https://..."
              value={link.url}
              onChange={(e) => updateLink(link.id, "url", e.target.value)}
            />
            <button type="button" className="danger-btn" onClick={() => removeLink(link.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>

      <button type="submit" disabled={!canSave}>
        Save account data
      </button>
    </form>
  );
}
