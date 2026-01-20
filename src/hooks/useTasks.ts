import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskWithRelations, TaskType, TaskPriority, TaskStatus } from '@/types/tasks';
import { startOfDay, endOfDay, addDays, format } from 'date-fns';

export interface TaskFilters {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority;
  type?: TaskType;
  assignee_id?: string;
  client_id?: string;
  lead_id?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// Fetch tasks with optional filters
async function fetchTasks(filters?: TaskFilters): Promise<TaskWithRelations[]> {
  let query = supabase
    .from('tasks')
    .select(`
      *,
      client:clients(id, name),
      lead:leads(id, name)
    `)
    .order('due_date', { ascending: true });

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }

  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  if (filters?.assignee_id) {
    query = query.eq('assignee_id', filters.assignee_id);
  }

  if (filters?.client_id) {
    query = query.eq('client_id', filters.client_id);
  }

  if (filters?.lead_id) {
    query = query.eq('lead_id', filters.lead_id);
  }

  if (filters?.startDate) {
    query = query.gte('due_date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('due_date', filters.endDate);
  }

  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as unknown as TaskWithRelations[];
}

// Main hook for fetching tasks
export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => fetchTasks(filters),
  });
}

// Fetch single task
export function useTask(id: string) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          client:clients(id, name),
          lead:leads(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as TaskWithRelations;
    },
    enabled: !!id,
  });
}

// Fetch today's tasks
export function useTodayTasks() {
  const today = new Date();
  return useTasks({
    startDate: format(startOfDay(today), "yyyy-MM-dd'T'HH:mm:ss"),
    endDate: format(endOfDay(today), "yyyy-MM-dd'T'HH:mm:ss"),
    status: ['pendente', 'em_andamento'],
  });
}

// Fetch overdue tasks
export function useOverdueTasks() {
  const now = new Date();
  return useQuery({
    queryKey: ['tasks', 'overdue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          client:clients(id, name),
          lead:leads(id, name)
        `)
        .lt('due_date', now.toISOString())
        .in('status', ['pendente', 'em_andamento'])
        .order('due_date', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as TaskWithRelations[];
    },
  });
}

// Fetch upcoming tasks (next 7 days)
export function useUpcomingTasks() {
  const today = new Date();
  const nextWeek = addDays(today, 7);
  return useTasks({
    startDate: format(startOfDay(today), "yyyy-MM-dd'T'HH:mm:ss"),
    endDate: format(endOfDay(nextWeek), "yyyy-MM-dd'T'HH:mm:ss"),
    status: ['pendente', 'em_andamento'],
  });
}

// Count pending tasks for header badge
export function usePendingTasksCount() {
  return useQuery({
    queryKey: ['tasks', 'pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pendente', 'em_andamento']);

      if (error) throw error;
      return count || 0;
    },
  });
}

// Create task mutation
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

// Update task mutation
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

// Complete task mutation
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: 'concluida',
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

// Delete task mutation
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
