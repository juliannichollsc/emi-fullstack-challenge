// Modelo derivado de db.json (raíz).

export interface TaskStateEntry {
  state: string;
  date: string; // ISO yyyy-mm-dd
}

export interface TaskNote {
  id: string;
  content: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO yyyy-mm-dd
  completed: boolean;
  stateHistory: TaskStateEntry[];
  notes: TaskNote[] | string[]; // db.json original usa string[]; nuevas tareas pueden migrar a TaskNote[].
}

export type TaskDraft = Omit<Task, 'id' | 'stateHistory'> & {
  initialState: string;
};
