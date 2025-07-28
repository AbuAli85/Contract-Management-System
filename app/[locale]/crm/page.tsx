'use client'

import { useState, useEffect } from "react";
import { useAuth } from "@/src/components/auth/simple-auth-provider";
import { createClient } from "@/lib/supabase/client";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import PromoterDashboard from "@/components/dashboard/PromoterDashboard";

export default function CRMPage() {
  const { roles, loading } = useAuth();
  const isAdmin = roles.includes("admin");
  const [promoters, setPromoters] = useState<{ id: string }[]>([]);
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

  console.log("CRM Page state:", { roles, loading, isAdmin, promotersLoading, promoters, error });

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

  // Show different dashboards based on user role
  return (
    <div className="min-h-screen bg-gray-50">
      {isAdmin ? (
        <AdminDashboard />
      ) : (
        <PromoterDashboard />
      )}
    </div>
  );
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = 'force-dynamic'