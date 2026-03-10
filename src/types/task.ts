export type Priority = 'Baixa' | 'Média' | 'Alta' | 'Crítica';
export type Area = 'Elétrica' | 'Mecânica' | 'Software';

export interface Task {
  id: string;
  description: string;
  priority: Priority;
  openedAt: string;
  deadline: string;
  responsible: string;
  area: Area;
  project: string;
  notes?: string;
}