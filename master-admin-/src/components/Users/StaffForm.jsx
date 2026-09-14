import { useState } from "react";

export default function StaffForm({ onSubmit, initialData = null }) {
  const [formData, setFormData] = useState(
    initialData || {
      name: "",
      email: "",
      role: "Staff",
      department: "Sales",
      status: "Active",
    },
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1 md:col-span-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase">
            Staff Name
          </label>
          <input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1"
            style={{ borderColor: "var(--border-color)" }}
            placeholder="e.g. Jordan Lee"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">
            Email Address
          </label>
          <input
            required
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1"
            style={{ borderColor: "var(--border-color)" }}
            placeholder="staff@adminstore.com"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">
            Role
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1"
            style={{ borderColor: "var(--border-color)" }}
          >
            <option>Admin</option>
            <option>Staff</option>
            <option>Operator</option>
            <option>Manager</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">
            Department
          </label>
          <select
            value={formData.department}
            onChange={(e) =>
              setFormData({ ...formData, department: e.target.value })
            }
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1"
            style={{ borderColor: "var(--border-color)" }}
          >
            <option>Sales</option>
            <option>Fulfillment</option>
            <option>Inventory</option>
            <option>Full Support</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1"
            style={{ borderColor: "var(--border-color)" }}
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
      </div>
      <div
        className="pt-4 flex justify-end gap-3 border-t"
        style={{ borderColor: "var(--border-color)" }}
      >
        <button
          type="submit"
          className="px-6 py-2 text-sm font-semibold text-white rounded-xl shadow-md"
          style={{ background: "var(--primary)" }}
        >
          {initialData ? "Update Member" : "Add Member"}
        </button>
      </div>
    </form>
  );
}
