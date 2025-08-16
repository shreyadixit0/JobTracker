import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Application {
  id: string;
  company: string;
  position: string;
  status: 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'HIRED' | 'SAVED';
  date_applied: string;
  notes?: string;
  resume_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationStats {
  total: number;
  byStatus: Record<Application['status'], number>;
  last30Days: { count: number };
}

export const useApplications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchApplications = async (filters?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id);

      // Apply filters
      if (filters?.search) {
        query = query.or(`company.ilike.%${filters.search}%,position.ilike.%${filters.search}%`);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      // Apply sorting
      const sortField = filters?.sort?.startsWith('-') ? filters.sort.slice(1) : (filters?.sort || 'created_at');
      const ascending = !filters?.sort?.startsWith('-');
      query = query.order(sortField, { ascending });

      // Apply pagination
      if (filters?.page && filters?.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;

      if (error) throw error;
      setApplications((data as Application[]) || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('applications')
        .select('status, created_at')
        .eq('user_id', user.id);

      if (error) throw error;

      const total = data?.length || 0;
      const byStatus = data?.reduce((acc, app) => {
        acc[app.status as Application['status']] = (acc[app.status as Application['status']] || 0) + 1;
        return acc;
      }, {
        APPLIED: 0,
        INTERVIEW: 0,
        OFFER: 0,
        REJECTED: 0,
        HIRED: 0,
        SAVED: 0
      } as Record<Application['status'], number>) || {
        APPLIED: 0,
        INTERVIEW: 0,
        OFFER: 0,
        REJECTED: 0,
        HIRED: 0,
        SAVED: 0
      };

      // Ensure all statuses are present
      const allStatuses: Application['status'][] = ['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'HIRED', 'SAVED'];
      allStatuses.forEach(status => {
        if (!byStatus[status]) byStatus[status] = 0;
      });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const last30Days = {
        count: data?.filter(app => new Date(app.created_at) >= thirtyDaysAgo).length || 0
      };

      setStats({ total, byStatus, last30Days });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch statistics",
        variant: "destructive",
      });
    }
  };

  const createApplication = async (application: Omit<Application, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('applications')
        .insert([{ ...application, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application created successfully",
      });

      await fetchApplications();
      await fetchStats();
      return data;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create application",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateApplication = async (id: string, updates: Partial<Application>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('applications')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application updated successfully",
      });

      await fetchApplications();
      await fetchStats();
      return data;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update application",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteApplication = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application deleted successfully",
      });

      await fetchApplications();
      await fetchStats();
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive",
      });
      return false;
    }
  };

  const uploadResume = async (file: File) => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('resumes')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload resume",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      fetchApplications();
      fetchStats();
    }
  }, [user]);

  return {
    applications,
    loading,
    stats,
    fetchApplications,
    fetchStats,
    createApplication,
    updateApplication,
    deleteApplication,
    uploadResume,
  };
};