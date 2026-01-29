import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TrustedHospital {
  id: string;
  user_id: string;
  hospital_name: string;
  hospital_address: string | null;
  hospital_phone: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface HospitalInput {
  hospital_name: string;
  hospital_address?: string;
  hospital_phone: string;
  priority: number;
}

export function useTrustedHospitals(userId?: string) {
  const [hospitals, setHospitals] = useState<TrustedHospital[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHospitals = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("trusted_hospitals")
        .select("*")
        .eq("user_id", userId)
        .order("priority", { ascending: true });

      if (error) throw error;
      setHospitals(data || []);
    } catch (error) {
      console.error("Error fetching hospitals:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Auto-fetch on mount and when userId changes
  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  const addHospital = useCallback(async (hospital: HospitalInput) => {
    if (!userId) return { error: new Error("User not authenticated") };

    try {
      const { data, error } = await supabase
        .from("trusted_hospitals")
        .insert({
          user_id: userId,
          ...hospital,
        })
        .select()
        .single();

      if (error) throw error;
      setHospitals(prev => [...prev, data].sort((a, b) => a.priority - b.priority));
      return { data, error: null };
    } catch (error: any) {
      console.error("Error adding hospital:", error);
      return { data: null, error };
    }
  }, [userId]);

  const addMultipleHospitals = useCallback(async (hospitalsToAdd: HospitalInput[]) => {
    if (!userId) return { error: new Error("User not authenticated") };

    try {
      const { data, error } = await supabase
        .from("trusted_hospitals")
        .insert(hospitalsToAdd.map(h => ({ user_id: userId, ...h })))
        .select();

      if (error) throw error;
      setHospitals(data || []);
      return { data, error: null };
    } catch (error: any) {
      console.error("Error adding hospitals:", error);
      return { data: null, error };
    }
  }, [userId]);

  const updateHospital = useCallback(async (id: string, updates: Partial<HospitalInput>) => {
    try {
      const { data, error } = await supabase
        .from("trusted_hospitals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      setHospitals(prev => 
        prev.map(h => h.id === id ? data : h).sort((a, b) => a.priority - b.priority)
      );
      return { data, error: null };
    } catch (error: any) {
      console.error("Error updating hospital:", error);
      return { data: null, error };
    }
  }, []);

  const deleteHospital = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("trusted_hospitals")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setHospitals(prev => prev.filter(h => h.id !== id));
      return { error: null };
    } catch (error: any) {
      console.error("Error deleting hospital:", error);
      return { error };
    }
  }, []);

  return {
    hospitals,
    loading,
    fetchHospitals,
    addHospital,
    addMultipleHospitals,
    updateHospital,
    deleteHospital,
  };
}
