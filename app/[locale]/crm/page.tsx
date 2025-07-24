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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPromoters = async () => {
      try {
        setPromotersLoading(true);
        setError(null);
        console.log("Fetching promoters...");
        
        const supabase = createClient();
        const { data, error } = await supabase
          .from("promoters")
          .select("id")
          .order("created_at", { ascending: false });
        
        console.log("Promoters fetch result:", { data, error });
        
        if (error) {
          console.error("Error fetching promoters:", error);
          setError(error.message);
          return;
        }
        
        if (data) {
          setPromoters(data);
          if (data.length > 0) {
            setSelectedPromoter(data[0].id);
            console.log("Selected first promoter:", data[0].id);
          }
        }
      } catch (err) {
        console.error("Exception fetching promoters:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setPromotersLoading(false);
      }
    };
    
    fetchPromoters();
  }, []);

  console.log("CRM Page state:", { role, loading, isAdmin, promotersLoading, promoters, selectedPromoter, error });

  if (loading) return <div className="p-8 text-center">Loading authentication...</div>;
  if (promotersLoading) return <div className="p-8 text-center">Loading promoters...</div>;
  
  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }
  
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