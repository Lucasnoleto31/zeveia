export type TaskType = 'follow_up' | 'reuniao' | 'ligacao' | 'email' | 'outro';
export type TaskPriority = 'baixa' | 'media' | 'alta' | 'urgente';
export type TaskStatus = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string;
  reminder_at?: string | null;
  completed_at?: string | null;
  client_id?: string | null;
  lead_id?: string | null;
  assignee_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaskWithRelations extends Task {
  client?: {
    id: string;
    name: string;
  } | null;
  lead?: {
    id: string;
    name: string;
  } | null;
  assignee?: {
    user_id: string;
    name: string;
  } | null;
}

export const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'ligacao', label: 'Ligação' },
  { value: 'email', label: 'E-mail' },
  { value: 'outro', label: 'Outro' },
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'baixa', label: 'Baixa', color: 'text-muted-foreground bg-muted' },
  { value: 'media', label: 'Média', color: 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30' },
  { value: 'alta', label: 'Alta', color: 'text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30' },
  { value: 'urgente', label: 'Urgente', color: 'text-destructive bg-destructive/10' },
];

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' },
];
