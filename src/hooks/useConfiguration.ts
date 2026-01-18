import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Origin, Campaign, LossReason, Product, Subproduct, Platform, Asset } from '@/types/database';

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
