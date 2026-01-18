import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Origin, Campaign, LossReason, Product, Subproduct, Platform, Asset } from '@/types/database';

// Generic update/toggle functions
type ConfigTable = 'origins' | 'campaigns' | 'loss_reasons' | 'products' | 'subproducts' | 'platforms' | 'assets';

// Origins
export function useOrigins() {
  return useQuery({
    queryKey: ['origins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('origins')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Origin[];
    },
  });
}

export function useCreateOrigin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('origins')
        .insert({ name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['origins'] }),
  });
}

export function useUpdateOrigin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, active }: { id: string; name?: string; active?: boolean }) => {
      const { data, error } = await supabase
        .from('origins')
        .update({ name, active })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['origins'] }),
  });
}

export function useDeleteOrigin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('origins').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['origins'] }),
  });
}

// Campaigns
export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Campaign[];
    },
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({ name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, active }: { id: string; name?: string; active?: boolean }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update({ name, active })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

// Loss Reasons
export function useLossReasons() {
  return useQuery({
    queryKey: ['lossReasons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loss_reasons')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as LossReason[];
    },
  });
}

export function useCreateLossReason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('loss_reasons')
        .insert({ name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lossReasons'] }),
  });
}

export function useUpdateLossReason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, active }: { id: string; name?: string; active?: boolean }) => {
      const { data, error } = await supabase
        .from('loss_reasons')
        .update({ name, active })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lossReasons'] }),
  });
}

export function useDeleteLossReason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('loss_reasons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lossReasons'] }),
  });
}

// Products
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('products')
        .insert({ name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, active }: { id: string; name?: string; active?: boolean }) => {
      const { data, error } = await supabase
        .from('products')
        .update({ name, active })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

// Subproducts
export function useSubproducts(productId?: string) {
  return useQuery({
    queryKey: ['subproducts', productId],
    queryFn: async () => {
      let query = supabase.from('subproducts').select('*, product:products(*)').order('name');
      if (productId) {
        query = query.eq('product_id', productId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Subproduct[];
    },
  });
}

export function useCreateSubproduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, name }: { productId: string; name: string }) => {
      const { data, error } = await supabase
        .from('subproducts')
        .insert({ product_id: productId, name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subproducts'] }),
  });
}

export function useUpdateSubproduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, active, productId }: { id: string; name?: string; active?: boolean; productId?: string }) => {
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (active !== undefined) updateData.active = active;
      if (productId !== undefined) updateData.product_id = productId;
      
      const { data, error } = await supabase
        .from('subproducts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subproducts'] }),
  });
}

export function useDeleteSubproduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('subproducts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subproducts'] }),
  });
}

// Platforms
export function usePlatforms() {
  return useQuery({
    queryKey: ['platforms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Platform[];
    },
  });
}

export function useCreatePlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('platforms')
        .insert({ name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platforms'] }),
  });
}

export function useUpdatePlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, active }: { id: string; name?: string; active?: boolean }) => {
      const { data, error } = await supabase
        .from('platforms')
        .update({ name, active })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platforms'] }),
  });
}

export function useDeletePlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('platforms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platforms'] }),
  });
}

// Assets
export function useAssets() {
  return useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('code');
      if (error) throw error;
      return data as Asset[];
    },
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ code, name }: { code: string; name?: string }) => {
      const { data, error } = await supabase
        .from('assets')
        .insert({ code, name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assets'] }),
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, code, name, active }: { id: string; code?: string; name?: string; active?: boolean }) => {
      const updateData: any = {};
      if (code !== undefined) updateData.code = code;
      if (name !== undefined) updateData.name = name;
      if (active !== undefined) updateData.active = active;
      
      const { data, error } = await supabase
        .from('assets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assets'] }),
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assets'] }),
  });
}
