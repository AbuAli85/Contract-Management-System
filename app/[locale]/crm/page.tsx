'use client'

import { useState, useEffect } from "react";
import { PromoterCRM } from "@/components/promoter-crm";
import { useAuth } from "@/context/AuthProvider";

export default function CRMPage() {
  const { role, loading } = useAuth();
  const isAdmin = role === "admin";
  const [promoters, setPromoters] = useState([]);
  const [selectedPromoter, setSelectedPromoter] = useState("");

  useEffect(() => {
    // Fetch real promoters from Supabase
    fetch("/api/promoters") // Adjust this endpoint to match your API
      .then(res => res.json())
      .then(data => {
        setPromoters(data);
        if (data.length > 0) setSelectedPromoter(data[0].id);
      });
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!isAdmin) return <div className="p-8 text-center">CRM features are restricted to administrators.</div>;
  if (!promoters.length) return <div className="p-8 text-center">No promoters found.</div>;

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