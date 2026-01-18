import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AppRole } from '@/types/database';

export interface ProfileWithRole extends Profile {
  role: AppRole;
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Profile[];
    },
  });
}

export function useProfilesWithRoles() {
  return useQuery({
    queryKey: ['profiles-with-roles'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role as AppRole]));
      
      return (profiles as Profile[]).map(p => ({
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
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]));
      
      return (profiles as Profile[]).map(p => ({
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
