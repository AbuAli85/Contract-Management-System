'use client'

import { useState } from "react";
import { PromoterCRM } from "@/components/promoter-crm";
import { useAuth } from "@/context/AuthProvider";

// Dummy promoter list for demonstration; replace with real data fetching
const promoters = [
  { id: "promoter-uuid-1", name: "John Doe" },
  { id: "promoter-uuid-2", name: "Jane Smith" },
];

export default function CRMPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [selectedPromoter, setSelectedPromoter] = useState(promoters[0].id);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Promoter CRM</h1>
      <div className="mb-4">
        <label htmlFor="promoter-select" className="block mb-2 font-medium">Select Promoter:</label>
        <select
          id="promoter-select"
          value={selectedPromoter}
          onChange={e => setSelectedPromoter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {promoters.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <PromoterCRM promoterId={selectedPromoter} isAdmin={isAdmin} />
    </div>
  );
}