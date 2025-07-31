export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskListProps {
  tasks: Task[];
  onToggleComplete?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onEditTask?: (taskId: string, updates: Partial<Task>) => void;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export interface TaskFormProps {
  onSubmit: (taskData: TaskFormData) => void;
  initialData?: Partial<TaskFormData>;
  isLoading?: boolean;
  submitButtonText?: string;
}

export interface TaskFormErrors {
  title?: string;
  description?: string;
  priority?: string;
}