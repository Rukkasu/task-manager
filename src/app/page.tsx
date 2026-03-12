"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import pb from "@/lib/pocketbase";
import { 
  Plus, ClipboardList, X, User, FolderKanban, LogOut,
  Pencil, Settings, Trash2, LayoutDashboard, Search, LayoutGrid, Table as TableIcon, 
  Calendar, Clock, Filter, CheckCircle2, RotateCcw
} from "lucide-react";
import "./home.css";

export default function AppIndustrialHub() {
  const [abaAtiva, setAbaAtiva] = useState<"tarefas" | "config">("tarefas");
  const router = useRouter();
  const [viewModo, setViewModo] = useState<"tabela" | "cards">("tabela");
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [listaConfigs, setListaConfigs] = useState<any[]>([]);
  const [buscaTermo, setBuscaTermo] = useState("");
  const [isModalAberto, setIsModalAberto] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isMenuColunasAberto, setIsMenuColunasAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const user = pb.authStore.model;

  const [colunas, setColunas] = useState({
    prioridade: true, descricao: true, projeto: true, area: true, responsavel: true, abertura: true, prazo: true, status: true
  });
  
  const [novaTarefa, setNovaTarefa] = useState({
    descricao: "", area: "", prioridade: 3, responsavel: "", projeto: "", prazo: ""
  });

  useEffect(() => {
    setIsMounted(true); // Avisa que o componente já está no navegador
    if (!pb.authStore.isValid) {
    router.push("/login");
  }
}, [router]);

  const handleLogout = () => {
    pb.authStore.clear();
    router.push("/login");
  };

  const carregarDados = async () => {
  try {
    //{ requestKey: null } para evitar o auto-cancelamento
    const resTarefas = await pb.collection('tarefas').getFullList({ requestKey: null });
    setTarefas(resTarefas);
    
    const resConfigs = await pb.collection('configs').getFullList({ requestKey: null });
    setListaConfigs(resConfigs);
  } catch (e: any) {
    // Ignora log de erro se for apenas um cancelamento intencional, 
    // mas como null ali em cima, esse erro deve sumir.
    if (!e.isAbort) {
      console.error("Erro ao carregar dados:", e);
    }
  }
};

  useEffect(() => {
    carregarDados();
    const interval = setInterval(carregarDados, 10000);
    return () => clearInterval(interval);
  }, []);

  const tarefasProcessadas = tarefas
    .filter(t => {
      const termo = buscaTermo.toLowerCase();
      return (
        t.descricao?.toLowerCase().includes(termo) ||
        t.responsavel?.toLowerCase().includes(termo) ||
        t.projeto?.toLowerCase().includes(termo) ||
        t.area?.toLowerCase().includes(termo)
      );
    })
    .sort((a, b) => (a.concluida === b.concluida ? a.prioridade - b.prioridade : a.concluida ? 1 : -1));

  const alternarConclusao = async (id: string, estadoAtual: boolean) => {
    try {
      await pb.collection('tarefas').update(id, { concluida: !estadoAtual });
      carregarDados();
    } catch (e) { alert("Erro ao atualizar!"); }
  };

  const salvarTarefa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editandoId) {
        await pb.collection('tarefas').update(editandoId, novaTarefa);
      } else {
        await pb.collection('tarefas').create({ ...novaTarefa, concluida: false });
      }
      fecharModal(); carregarDados();
    } catch (e) { alert("Erro ao salvar!"); }
  };

  const fecharModal = () => {
    setIsModalAberto(false); setEditandoId(null);
    setNovaTarefa({ descricao: "", area: "", prioridade: 3, responsavel: "", projeto: "", prazo: "" });
  };

  const formatarDataBR = (dataStr: string) => {
    if (!dataStr) return "---";
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    return `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${ano}`;
  };

  const getPriorityStyle = (p: number, concluida: boolean) => {
    if (concluida) return "bg-slate-100 text-slate-400 border-slate-200";
    const colors: any = { 
      0: "bg-red-600 text-white", 
      1: "bg-red-400 text-white", 
      2: "bg-orange-500 text-white", 
      3: "bg-yellow-400 text-yellow-900", 
      6: "bg-green-600 text-white" 
    };
    return colors[p] || "bg-blue-500 text-white";
  };

  return (
    <div className="home-container">
      {/* HEADER */}
      <nav className="home-header">
        <div className="flex items-center gap-6">
          <h1 className="brand-logo"><ClipboardList size={24} /> Industrial Hub</h1>
          <div className="nav-tabs">
            <button onClick={() => setAbaAtiva("tarefas")} className={`tab-btn ${abaAtiva === 'tarefas' ? 'tab-btn-active' : 'tab-btn-inactive'}`}>
              <LayoutDashboard size={14} /> DASHBOARD
            </button>
            <button onClick={() => setAbaAtiva("config")} className={`tab-btn ${abaAtiva === 'config' ? 'tab-btn-active' : 'tab-btn-inactive'}`}>
              <Settings size={14} /> CONFIG
            </button>
          </div>
        </div>

        <div className="search-wrapper">
          <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
            <button onClick={() => setViewModo("tabela")} className={`p-2 rounded-lg transition-all ${viewModo === 'tabela' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>
              <TableIcon size={18} />
            </button>
            <button onClick={() => setViewModo("cards")} className={`p-2 rounded-lg transition-all ${viewModo === 'cards' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>
              <LayoutGrid size={18} />
            </button>
          </div>

          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Busca por responsável, área..." value={buscaTermo} onChange={(e) => setBuscaTermo(e.target.value)} className="search-input" />
          </div>
          <button onClick={() => setIsMenuColunasAberto(!isMenuColunasAberto)} className={`p-2.5 rounded-xl transition-all ${isMenuColunasAberto ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}><Filter size={20} /></button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="user-info-group">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-tighter">
                {isMounted ? (user?.name || 'Operador') : 'Operador'}
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase">
                {isMounted ? user?.email : ''}
              </span>
            </div>
            <div className="user-avatar">{isMounted ? (user?.name?.charAt(0).toUpperCase() || "U") : "?"}</div>
            <button onClick={handleLogout} className="ml-2 p-2 text-slate-300 hover:text-red-500 transition-colors" title="Sair"><LogOut size={20} /></button>
          </div>
          <button onClick={() => { 
            setEditandoId(null); 
            setNovaTarefa({ descricao: "", area: "", prioridade: 3, responsavel: "", projeto: "", prazo: new Date().toISOString().split('T')[0] }); 
            setIsModalAberto(true); 
          }} className="btn-primary">
            <Plus size={18} /> Lançar
          </button>
        </div>
      </nav>

      <main className="p-4 md:p-8 max-w-[1650px] mx-auto">
        {isMenuColunasAberto && (
          <div className="absolute z-20 bg-white shadow-2xl border border-slate-100 p-6 rounded-[30px] mt-[-20px] ml-[40%] animate-in fade-in zoom-in-95 duration-200">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Exibir Colunas</p>
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(colunas).map((col) => (
                <label key={col} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-all">
                  <input type="checkbox" checked={(colunas as any)[col]} onChange={() => setColunas({...colunas, [col]: !(colunas as any)[col]})} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-xs font-bold text-slate-600 capitalize">{col}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {abaAtiva === "tarefas" ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {viewModo === "tabela" ? (
              <div className="table-container">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="table-head-row">
                      {colunas.prioridade && <th className="p-5 w-20 text-center">PRI</th>}
                      {colunas.descricao && <th className="p-5">Descrição</th>}
                      {colunas.area && <th className="p-5">Área</th>}
                      <th className="p-5">Status</th>
                      {colunas.responsavel && <th className="p-5">Responsável</th>}
                      {colunas.prazo && <th className="p-5">Prazo</th>}
                      <th className="p-5 text-right px-8">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {tarefasProcessadas.map((t) => {
                      const hoje = new Date().toISOString().split('T')[0];
                      const status = t.prazo < hoje ? 'Atrasado' : t.prazo === hoje ? 'Hoje' : 'Em Prazo';
                      const statusColor = t.concluida ? 'bg-slate-100 text-slate-400' : (status === 'Atrasado' ? 'bg-red-100 text-red-600' : status === 'Hoje' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600');
                      
                      return (
                        <tr key={t.id} className={`hover:bg-slate-50/80 transition-all group ${t.concluida ? 'opacity-40' : ''}`}>
                          {colunas.prioridade && <td className="p-4 text-center"><div className={`priority-circle ${getPriorityStyle(t.prioridade, t.concluida)}`}>{t.prioridade}</div></td>}
                          <td className="p-4 cursor-pointer" onClick={() => { setEditandoId(t.id); setNovaTarefa(t); setIsModalAberto(true); }}>
                            <p className={`font-black text-sm ${t.concluida ? 'line-through text-slate-400' : 'text-slate-800'}`}>{t.descricao}</p>
                          </td>
                          <td className="p-4"><span className="bg-slate-100 text-slate-500 px-2 py-1 rounded font-black uppercase text-[9px]">{t.area}</span></td>
                          <td className="p-4"><span className={`px-2 py-1 rounded-full font-black uppercase text-[8px] tracking-tighter ${statusColor}`}>{t.concluida ? 'OK' : status}</span></td>
                          <td className="p-4 font-black italic text-slate-700">{t.responsavel}</td>
                          <td className="p-4 font-black">{formatarDataBR(t.prazo)}</td>
                          <td className="p-4 text-right px-8">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditandoId(t.id); setNovaTarefa(t); setIsModalAberto(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Pencil size={16}/></button>
                              <button onClick={() => alternarConclusao(t.id, t.concluida)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all">
                                {t.concluida ? <RotateCcw size={16}/> : <CheckCircle2 size={16}/>}
                              </button>
                              <button onClick={() => { if(confirm("Remover?")) pb.collection('tarefas').delete(t.id).then(carregarDados) }} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16}/></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tarefasProcessadas.map((t) => {
                  const hoje = new Date().toISOString().split('T')[0];
                  const status = t.prazo < hoje ? 'Atrasado' : t.prazo === hoje ? 'Hoje' : 'Em Prazo';
                  return (
                    <div key={t.id} className={`bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative ${t.concluida ? 'grayscale opacity-60' : ''}`}>
                      <div className={`absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${getPriorityStyle(t.prioridade, t.concluida)}`}>{t.prioridade}</div>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 italic">{t.area}</p>
                      <h3 className={`text-lg font-black leading-tight mb-4 ${t.concluida ? 'line-through text-slate-400' : 'text-slate-800'}`}>{t.descricao}</h3>
                      <div className="flex items-center gap-2 mb-4 text-slate-500"><User size={14} /> <span className="text-xs font-bold italic">{t.responsavel}</span></div>
                      <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{formatarDataBR(t.prazo)}</span>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditandoId(t.id); setNovaTarefa(t); setIsModalAberto(true); }} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Pencil size={14}/></button>
                          <button onClick={() => alternarConclusao(t.id, t.concluida)} className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all"><CheckCircle2 size={14}/></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {(['area', 'responsavel', 'projeto'] as const).map((tipo) => (
               <div key={tipo} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                 <h3 className="font-black uppercase text-[10px] text-blue-600 mb-6 tracking-widest text-center italic">Gerir {tipo}s</h3>
                 <input type="text" placeholder={`Adicionar ${tipo}...`} className="input-field mb-6" onKeyDown={(e) => { if(e.key === 'Enter') { pb.collection('configs').create({ tipo, valor: e.currentTarget.value }).then(carregarDados); e.currentTarget.value = ""; } }} />
                 <div className="space-y-1">
                   {listaConfigs.filter(c => c.tipo === tipo).map((item) => (
                     <div key={item.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl group transition-all">
                       <span className="text-sm font-bold text-slate-600">{item.valor}</span>
                       <button onClick={() => pb.collection('configs').delete(item.id).then(carregarDados)} className="text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                     </div>
                   ))}
                 </div>
               </div>
             ))}
          </div>
        )}
      </main>

      {/* MODAL LANÇAMENTO */}
      {isModalAberto && (
        <div className="modal-overlay animate-in fade-in duration-300">
          <div className="modal-content animate-in zoom-in-95 duration-300">
            <button onClick={fecharModal} className="absolute right-8 top-8 text-slate-300 hover:text-red-600"><X size={32} /></button>
            <h2 className="text-3xl font-black mb-8 text-slate-800 uppercase italic">{editandoId ? "Editar Lançamento" : "Novo Lançamento"}</h2>
            <form onSubmit={salvarTarefa} className="space-y-4">
              <div className="space-y-1">
                <label className="input-label">O que precisa ser feito?</label>
                <input required placeholder="Descreva a atividade..." value={novaTarefa.descricao} className="input-field" onChange={e => setNovaTarefa({...novaTarefa, descricao: e.target.value})}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="input-label">Área</label>
                  <input list="lista-area" required value={novaTarefa.area} className="input-field" onChange={e => setNovaTarefa({...novaTarefa, area: e.target.value})}/>
                </div>
                <div className="space-y-1">
                  <label className="input-label">Prioridade (0-6)</label>
                  <input type="number" min="0" max="6" value={novaTarefa.prioridade} className="input-field font-black" onChange={e => setNovaTarefa({...novaTarefa, prioridade: Number(e.target.value)})}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="input-label">Responsável</label>
                  <input list="lista-responsavel" required value={novaTarefa.responsavel} className="input-field italic" onChange={e => setNovaTarefa({...novaTarefa, responsavel: e.target.value})}/>
                </div>
                <div className="space-y-1">
                  <label className="input-label">Prazo Final</label>
                  <input type="date" required value={novaTarefa.prazo} className="input-field" onChange={e => setNovaTarefa({...novaTarefa, prazo: e.target.value})}/>
                </div>
              </div>
              <div className="space-y-1">
                <label className="input-label">Projeto / OS</label>
                <input list="lista-projeto" placeholder="Ex: Manutenção" value={novaTarefa.projeto} className="input-field font-bold text-blue-600" onChange={e => setNovaTarefa({...novaTarefa, projeto: e.target.value})}/>
              </div>
              <datalist id="lista-area">{listaConfigs.filter(c => c.tipo === 'area').map(o => <option key={o.id} value={o.valor}/>)}</datalist>
              <datalist id="lista-responsavel">{listaConfigs.filter(c => c.tipo === 'responsavel').map(o => <option key={o.id} value={o.valor}/>)}</datalist>
              <datalist id="lista-projeto">{listaConfigs.filter(c => c.tipo === 'projeto').map(o => <option key={o.id} value={o.valor}/>)}</datalist>
              <button type="submit" className="btn-confirm">{editandoId ? "Salvar Alterações" : "Confirmar Registro"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}