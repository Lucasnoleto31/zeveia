import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AppRole } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

export interface ProfileWithRole extends Profile {
  role: AppRole;
}

// Batch fetch all profiles to overcome 1000 record limit
async function fetchAllProfiles() {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name')
      .range(from, to);

    if (error) throw error;

    if (data && data.length > 0) {
      allData = [...allData, ...data];
      hasMore = data.length === PAGE_SIZE;
      page++;
    } else {
      hasMore = false;
    }
  }

  return allData as Profile[];
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => fetchAllProfiles(),
  });
}

export function useProfilesWithRoles() {
  return useQuery({
    queryKey: ['profiles-with-roles'],
    queryFn: async () => {
      const profiles = await fetchAllProfiles();

      // Batch fetch all user roles
      const PAGE_SIZE = 1000;
      let allRoles: any[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .range(from, to);

        if (error) throw error;

        if (data && data.length > 0) {
          allRoles = [...allRoles, ...data];
          hasMore = data.length === PAGE_SIZE;
          page++;
        } else {
          hasMore = false;
        }
      }

      const rolesMap = new Map(allRoles?.map(r => [r.user_id, r.role as AppRole]));
      
      return profiles.map(p => ({
        ...p,
        role: rolesMap.get(p.user_id) || 'assessor' as AppRole
      })) as ProfileWithRole[];
    },
  });
}

export function useAssessors() {
  return useQuery({
    queryKey: ['assessors'],
    queryFn: async () => {
      const profiles = await fetchAllProfiles();

      // Batch fetch all user roles
      const PAGE_SIZE = 1000;
      let allRoles: any[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .range(from, to);

        if (error) throw error;

        if (data && data.length > 0) {
          allRoles = [...allRoles, ...data];
          hasMore = data.length === PAGE_SIZE;
          page++;
        } else {
          hasMore = false;
        }
      }

      const rolesMap = new Map(allRoles?.map(r => [r.user_id, r.role]));
      
      return profiles.map(p => ({
        ...p,
        role: rolesMap.get(p.user_id) || 'assessor'
      }));
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // First delete existing role
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) throw deleteError;

      // Then insert new role
      const { data, error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['assessors'] });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, name, email }: { id: string; name?: string; email?: string }) => {
      const updateData: Partial<Profile> = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['assessors'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { isSocio } = useAuth();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!isSocio) {
        throw new Error('Apenas sócios podem excluir usuários');
      }

      // Delete user role first
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      if (roleError) throw roleError;

      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      
      if (profileError) throw profileError;

      // Note: The auth.users record cannot be deleted from client-side
      // It will remain but the user won't have access without profile/role
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['assessors'] });
    },
  });
}
