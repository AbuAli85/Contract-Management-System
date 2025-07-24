'use client'

import { useState, useEffect } from "react";
import { PromoterCRM } from "@/components/promoter-crm";
import { useAuth } from "@/context/AuthProvider";
import { createClient } from "@/lib/supabase/client";

export default function CRMPage() {
  const { role, loading } = useAuth();
  const isAdmin = role === "admin";
  const [promoters, setPromoters] = useState<{ id: string }[]>([]);
  const [selectedPromoter, setSelectedPromoter] = useState("");
  const [promotersLoading, setPromotersLoading] = useState(true);

  useEffect(() => {
    const fetchPromoters = async () => {
      setPromotersLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("promoters")
        .select("id")
        .order("created_at", { ascending: false });
      if (!error && data) {
        setPromoters(data);
        if (data.length > 0) setSelectedPromoter(data[0].id);
      }
      setPromotersLoading(false);
    };
    fetchPromoters();
  }, []);

  if (loading || promotersLoading) return <div className="p-8 text-center">Loading...</div>;
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
          {promoters.map((p) => (
            <option key={p.id} value={p.id}>{p.id}</option>
          ))}
        </select>
      </div>
      <PromoterCRM promoterId={selectedPromoter} isAdmin={isAdmin} />
    </div>
  );
}