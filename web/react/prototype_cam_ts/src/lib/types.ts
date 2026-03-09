export type TaskStatus = 'completed' | 'in-progress' | 'pending';
export type TaskRequirement = 'required' | 'optional';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  requirement: TaskRequirement;
  image?: string;
}

export interface TaskGroup {
  id: string;
  name: string;
  tasks: Task[];
}
