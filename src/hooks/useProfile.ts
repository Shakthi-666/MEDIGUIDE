import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  health_conditions: string | null;
  checkup_data: string | null;
  location: string | null;
  contact_number: string | null;
  emergency_contact_number: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileFormData {
  full_name: string;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  health_conditions: string;
  checkup_data: string;
  location: string;
  contact_number: string;
  emergency_contact_number: string;
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!userId) return null;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createProfile = useCallback(async (data: ProfileFormData) => {
    if (!userId) return { error: new Error("Not authenticated") };
    
    setLoading(true);
    try {
      const { data: newProfile, error } = await supabase
        .from("profiles")
        .insert({
          user_id: userId,
          full_name: data.full_name,
          age: data.age,
          height_cm: data.height_cm,
          weight_kg: data.weight_kg,
          health_conditions: data.health_conditions || null,
          checkup_data: data.checkup_data || null,
          location: data.location || null,
          contact_number: data.contact_number || null,
          emergency_contact_number: data.emergency_contact_number,
        })
        .select()
        .single();

      if (error) throw error;
      setProfile(newProfile);
      return { data: newProfile, error: null };
    } catch (error: any) {
      console.error("Error creating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create profile",
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateProfile = useCallback(async (data: Partial<ProfileFormData>) => {
    if (!userId) return { error: new Error("Not authenticated") };
    
    setLoading(true);
    try {
      const { data: updatedProfile, error } = await supabase
        .from("profiles")
        .update(data)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      setProfile(updatedProfile);
      return { data: updatedProfile, error: null };
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    profile,
    loading,
    fetchProfile,
    createProfile,
    updateProfile,
  };
}
