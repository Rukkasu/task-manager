import { Task } from "@/types/task";
import { Clock, User, HardDrive } from "lucide-react";

export function TaskTable({ tasks }: { tasks: Task[] }) {
  const priorityColor = {
    Baixa: "bg-blue-100 text-blue-700",
    Média: "bg-yellow-100 text-yellow-700",
    Alta: "bg-orange-100 text-orange-700",
    Crítica: "bg-red-100 text-red-700",
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="p-4 font-semibold text-slate-600">Descrição</th>
            <th className="p-4 font-semibold text-slate-600">Prioridade</th>
            <th className="p-4 font-semibold text-slate-600">Área</th>
            <th className="p-4 font-semibold text-slate-600">Responsável</th>
            <th className="p-4 font-semibold text-slate-600">Prazo</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-b hover:bg-slate-50 transition">
              <td className="p-4 text-slate-800 font-medium">{task.description}</td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${priorityColor[task.priority]}`}>
                  {task.priority}
                </span>
              </td>
              <td className="p-4 text-slate-600">{task.area}</td>
              <td className="p-4 text-slate-600 flex items-center gap-2">
                <User size={16} /> {task.responsible}
              </td>
              <td className="p-4 text-slate-600">{task.deadline}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}