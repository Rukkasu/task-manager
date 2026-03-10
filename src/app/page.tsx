"use client";
import { useState, useEffect } from "react";
import PocketBase from 'pocketbase';
import { 
  Plus, ClipboardList, X, User, FolderKanban, 
  Pencil, Settings, Trash2, LayoutDashboard, Search, LayoutGrid, Table as TableIcon, Calendar, Clock, Filter, CheckCircle2, RotateCcw
} from "lucide-react";

const pb = new PocketBase('http://192.168.0.130:8090'); 

export default function AppIndustrialHub() {
  const [abaAtiva, setAbaAtiva] = useState<"tarefas" | "config">("tarefas");
  const [viewModo, setViewModo] = useState<"tabela" | "cards">("tabela");
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [listaConfigs, setListaConfigs] = useState<any[]>([]);
  const [buscaTermo, setBuscaTermo] = useState("");
  const [isModalAberto, setIsModalAberto] = useState(false);
  const [isMenuColunasAberto, setIsMenuColunasAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [colunas, setColunas] = useState({
    prioridade: true, descricao: true, projeto: true, area: true, responsavel: true, abertura: true, prazo: true, status: true
  });
  
  const [novaTarefa, setNovaTarefa] = useState({
    descricao: "", area: "", prioridade: 3, responsavel: "", projeto: "", prazo: ""
  });

  const carregarDados = async () => {
    try {
      const resTarefas = await pb.collection('tarefas').getFullList();
      setTarefas(resTarefas);
      const resConfigs = await pb.collection('configs').getFullList();
      setListaConfigs(resConfigs);
    } catch (e) { console.error("Erro ao carregar dados:", e); }
  };

  useEffect(() => {
    carregarDados();
    const interval = setInterval(carregarDados, 10000); // Atualiza a cada 10s
    return () => clearInterval(interval);
  }, []);

  // --- LÓGICA DE ORGANIZAÇÃO (Agrupado por Responsável + Prioridade 0 no topo) ---
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
    .sort((a, b) => {
      // 1. Tarefas concluídas sempre para o final da lista
      if (a.concluida && !b.concluida) return 1;
      if (!a.concluida && b.concluida) return -1;

      // Se ambas tiverem o mesmo status (ex: ambas pendentes):
      if (!a.concluida && !b.concluida) {
        // 2. Agrupar por Responsável (Ordem Alfabética A-Z)
        const respA = (a.responsavel || "").toLowerCase();
        const respB = (b.responsavel || "").toLowerCase();
        if (respA !== respB) {
          return respA.localeCompare(respB);
        }
        // 3. Dentro do mesmo responsável, Prioridade 0 no topo
        return a.prioridade - b.prioridade;
      }
      
      return 0;
    });

  const alternarConclusao = async (id: string, estadoAtual: boolean) => {
    try {
      const novoEstado = !estadoAtual;
      // Update otimista na UI
      setTarefas(prev => prev.map(t => t.id === id ? { ...t, concluida: novoEstado } : t));
      
      await pb.collection('tarefas').update(id, { concluida: novoEstado });
    } catch (e) { 
      alert("Erro ao atualizar! Certifique-se que a coluna 'concluida' (tipo Bool) existe no PocketBase.");
      carregarDados(); // Reverte em caso de erro
    }
  };

  const verificarStatusPrazo = (prazoStr: string, concluida: boolean) => {
    if (concluida) return { texto: "Finalizado", cor: "text-blue-600 bg-blue-50" };
    if (!prazoStr) return { texto: "Sem Prazo", cor: "text-slate-400 bg-slate-100" };
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const [ano, mes, dia] = prazoStr.split('-').map(Number);
    const dataPrazo = new Date(ano, mes - 1, dia);
    dataPrazo.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((dataPrazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { texto: "Em Atraso", cor: "text-red-600 bg-red-50" };
    if (diffDays === 0) return { texto: "Vence Hoje", cor: "text-orange-600 bg-orange-50" };
    return { texto: "No Prazo", cor: "text-green-600 bg-green-50" };
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
    } catch (e) { alert("Erro ao salvar tarefa!"); }
  };

  const fecharModal = () => {
    setIsModalAberto(false); setEditandoId(null);
    setNovaTarefa({ descricao: "", area: "", prioridade: 3, responsavel: "", projeto: "", prazo: "" });
  };

  const getPriorityStyle = (p: number, concluida: boolean) => {
    if (concluida) return "bg-slate-100 text-slate-400 border-slate-200";
    const styles: Record<number, string> = { 
      0: "bg-red-600 text-white", 
      1: "bg-red-400 text-white", 
      2: "bg-orange-500 text-white", 
      3: "bg-yellow-400 text-yellow-900", 
      4: "bg-lime-400 text-lime-900", 
      5: "bg-green-400 text-white", 
      6: "bg-green-600 text-white" 
    };
    return styles[p] || "bg-slate-200";
  };

  const formatarDataBR = (dataStr: string) => {
    if (!dataStr) return "---";
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    return `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${ano}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap justify-between items-center sticky top-0 z-40 gap-4">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-black text-red-600 flex items-center gap-1 uppercase italic"><ClipboardList size={28} /> SELETTRA PRIORIDADES</h1>
          <div className="flex bg-slate-100 p-1 rounded-xl text-[10px] font-black">
            <button onClick={() => setAbaAtiva("tarefas")} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${abaAtiva === 'tarefas' ? 'bg-white shadow-sm text-red-600' : 'text-slate-400'}`}><LayoutDashboard size={14} /> DASHBOARD</button>
            <button onClick={() => setAbaAtiva("config")} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${abaAtiva === 'config' ? 'bg-white shadow-sm text-red-600' : 'text-slate-400'}`}><Settings size={14} /> CONFIG</button>
          </div>
        </div>

        <div className="flex-1 max-w-md relative flex items-center gap-2">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Busca por responsável, área ou projeto..." value={buscaTermo} onChange={(e) => setBuscaTermo(e.target.value)} className="w-full bg-slate-100 border-none rounded-2xl py-2.5 pl-12 pr-4 text-sm font-bold outline-none shadow-inner" />
          </div>
          <button onClick={() => setIsMenuColunasAberto(!isMenuColunasAberto)} className={`p-2.5 rounded-xl transition-all ${isMenuColunasAberto ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><Filter size={20} /></button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setViewModo("tabela")} className={`p-2 rounded-lg ${viewModo === 'tabela' ? 'bg-white shadow-sm text-red-600' : 'text-slate-400'}`}><TableIcon size={18} /></button>
            <button onClick={() => setViewModo("cards")} className={`p-2 rounded-lg ${viewModo === 'cards' ? 'bg-white shadow-sm text-red-600' : 'text-slate-400'}`}><LayoutGrid size={18} /></button>
          </div>
          <button onClick={() => setIsModalAberto(true)} className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg shadow-red-100 active:scale-95 transition-all flex items-center gap-2 tracking-widest"><Plus size={18} /> Lançar</button>
        </div>
      </nav>

      <main className="p-4 md:p-8 max-w-[1650px] mx-auto">
        {abaAtiva === "tarefas" ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {viewModo === "tabela" ? (
              <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-widest">
                      {colunas.prioridade && <th className="p-5 w-20 text-center">PRI</th>}
                      {colunas.descricao && <th className="p-5">Descrição da Tarefa</th>}
                      {colunas.area && <th className="p-5">Área</th>}
                      {colunas.responsavel && <th className="p-5">Responsável</th>}
                      {colunas.abertura && <th className="p-5">Abertura</th>}
                      {colunas.prazo && <th className="p-5">Prazo Final</th>}
                      {colunas.status && <th className="p-5">Status</th>}
                      <th className="p-5 text-right px-8">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {tarefasProcessadas.map((t) => {
                      const status = verificarStatusPrazo(t.prazo, t.concluida);
                      return (
                        <tr key={t.id} className={`hover:bg-slate-50/80 transition-all group ${t.concluida ? 'opacity-40 grayscale-[0.8]' : ''}`}>
                          {colunas.prioridade && (
                            <td className="p-4">
                              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-black border-2 shadow-sm ${getPriorityStyle(t.prioridade, t.concluida)}`}>
                                {t.prioridade}
                              </div>
                            </td>
                          )}
                          {colunas.descricao && (
                            <td className="p-4">
                              <p className={`font-black text-sm mb-0.5 ${t.concluida ? 'line-through' : 'text-slate-800'}`}>{t.descricao}</p>
                              {colunas.projeto && <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter italic">{t.projeto || "Geral"}</p>}
                            </td>
                          )}
                          {colunas.area && <td className="p-4"><span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md font-black uppercase text-[9px]">{t.area}</span></td>}
                          {colunas.responsavel && <td className="p-4 font-black text-slate-700 italic text-sm">{t.responsavel}</td>}
                          {colunas.abertura && <td className="p-4 text-slate-400 font-bold">{new Date(t.created).toLocaleDateString('pt-BR')}</td>}
                          {colunas.prazo && <td className={`p-4 font-black ${status.texto === 'Em Atraso' ? 'text-red-600' : 'text-slate-700'}`}>{formatarDataBR(t.prazo)}</td>}
                          {colunas.status && (
                            <td className="p-4">
                              <span className={`px-3 py-1.5 rounded-full font-black uppercase text-[9px] flex items-center gap-1.5 w-fit shadow-sm ${status.cor}`}>
                                {t.concluida ? <CheckCircle2 size={12}/> : <Clock size={12}/>} {status.texto}
                              </span>
                            </td>
                          )}
                          <td className="p-4 text-right px-8">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => alternarConclusao(t.id, t.concluida)} title={t.concluida ? "Reabrir" : "Concluir"} className={`p-2.5 rounded-xl shadow-sm transition-all ${t.concluida ? 'bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white' : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'}`}>
                                {t.concluida ? <RotateCcw size={18}/> : <CheckCircle2 size={18}/>}
                              </button>
                              {!t.concluida && (
                                <button onClick={() => { setEditandoId(t.id); setNovaTarefa(t); setIsModalAberto(true); }} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white shadow-sm transition-all"><Pencil size={18}/></button>
                              )}
                              <button onClick={() => { if(confirm("Remover permanentemente?")) pb.collection('tarefas').delete(t.id).then(carregarDados) }} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white shadow-sm transition-all"><Trash2 size={18}/></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* MODO CARDS */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tarefasProcessadas.map(t => {
                  const status = verificarStatusPrazo(t.prazo, t.concluida);
                  return (
                    <div key={t.id} className={`bg-white rounded-[35px] p-6 shadow-sm border border-slate-200 relative group flex flex-col justify-between hover:shadow-xl transition-all border-t-4 ${t.concluida ? 'opacity-60 grayscale-[0.5]' : 'hover:-translate-y-1'}`} style={{ borderTopColor: t.concluida ? "#cbd5e1" : (status.texto === "Em Atraso" ? "#ef4444" : "#e2e8f0") }}>
                      <div className={`absolute top-0 right-0 w-12 h-12 flex items-center justify-center font-black text-xl rounded-bl-3xl shadow-sm ${getPriorityStyle(t.prioridade, t.concluida)}`}>{t.prioridade}</div>
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.area}</span>
                           <span className={`px-2 py-0.5 rounded-md font-black uppercase text-[8px] ${status.cor}`}>{status.texto}</span>
                        </div>
                        <h3 className={`text-lg font-black leading-tight mb-4 pr-6 ${t.concluida ? 'line-through text-slate-400' : 'text-slate-800'}`}>{t.descricao}</h3>
                        <div className="space-y-2 mb-6 text-slate-500 font-bold text-[11px]">
                          <div className="flex items-center gap-2 uppercase tracking-tighter"><FolderKanban size={14} className="text-red-500" /> {t.projeto || "Geral"}</div>
                          <div className="flex items-center gap-2 text-slate-800 font-black italic"><User size={14} className="text-red-500" /> {t.responsavel}</div>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[8px] font-black text-slate-300 uppercase">Aberto em: {new Date(t.created).toLocaleDateString('pt-BR')}</p>
                          <p className={`text-xs font-black flex items-center gap-1 mt-0.5 ${t.concluida ? 'text-slate-400' : (status.texto === 'Em Atraso' ? 'text-red-600' : 'text-slate-700')}`}><Calendar size={14} /> {formatarDataBR(t.prazo)}</p>
                        </div>
                        <div className="flex gap-1.5">
                           <button onClick={() => alternarConclusao(t.id, t.concluida)} className={`p-2.5 rounded-xl transition-all shadow-sm ${t.concluida ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                             {t.concluida ? <RotateCcw size={18}/> : <CheckCircle2 size={18}/>}
                           </button>
                           {!t.concluida && (
                             <button onClick={() => { setEditandoId(t.id); setNovaTarefa(t); setIsModalAberto(true); }} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Pencil size={18}/></button>
                           )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ABA CONFIGURAÇÕES */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-500">
             {(['area', 'responsavel', 'projeto'] as const).map((tipo) => (
                <div key={tipo} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-2 h-full bg-red-600 opacity-20"></div>
                  <h3 className="font-black uppercase text-[10px] text-slate-400 mb-6 tracking-[0.3em] text-center italic text-red-600">Gerir {tipo}s</h3>
                  <input type="text" placeholder={`Adicionar ${tipo}...`} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none mb-6 shadow-inner focus:ring-2 ring-red-100 transition-all" onKeyDown={(e) => { if(e.key === 'Enter') { pb.collection('configs').create({ tipo, valor: e.currentTarget.value }).then(carregarDados); e.currentTarget.value = ""; } }} />
                  <div className="space-y-1 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {listaConfigs.filter(c => c.tipo === tipo).map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-4 hover:bg-slate-50 rounded-2xl group/item transition-all border border-transparent hover:border-slate-100">
                        <span className="text-sm font-black text-slate-600 tracking-tight">{item.valor}</span>
                        <button onClick={() => pb.collection('configs').delete(item.id).then(carregarDados)} className="text-slate-200 hover:text-red-600 opacity-0 group-hover/item:opacity-100 transition-opacity"><Trash2 size={18} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>

      {/* MODAL CONFIGURAÇÃO DE COLUNAS */}
      {isMenuColunasAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-in fade-in" onClick={() => setIsMenuColunasAberto(false)}>
          <div className="bg-white rounded-[40px] shadow-2xl p-8 w-full max-w-xs border border-slate-100 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <p className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-[0.2em] text-center italic">Visualização da Tabela</p>
            <div className="grid grid-cols-1 gap-2">
              {Object.keys(colunas).map((col) => (
                <label key={col} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 cursor-pointer group transition-all border border-transparent hover:border-slate-100">
                  <span className="text-xs font-black text-slate-600 uppercase tracking-tighter">{col}</span>
                  <input type="checkbox" checked={colunas[col as keyof typeof colunas]} onChange={() => setColunas({...colunas, [col]: !colunas[col as keyof typeof colunas]})} className="w-5 h-5 accent-red-600 cursor-pointer rounded-lg" />
                </label>
              ))}
            </div>
            <button onClick={() => setIsMenuColunasAberto(false)} className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-colors shadow-lg">Aplicar Filtros</button>
          </div>
        </div>
      )}

      {/* MODAL LANÇAMENTO / EDIÇÃO */}
      {isModalAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-[45px] w-full max-w-xl p-10 shadow-2xl relative border-t-[14px] border-red-600 animate-in zoom-in-95">
            <button onClick={fecharModal} className="absolute right-8 top-8 text-slate-300 hover:text-red-600 transition-colors"><X size={32} /></button>
            <h2 className="text-3xl font-black mb-8 text-slate-800 tracking-tighter uppercase italic">{editandoId ? 'Editar Registo' : 'Novo Lançamento'}</h2>
            
            <form onSubmit={salvarTarefa} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic">O que precisa ser feito?</label>
                <input required placeholder="Descreva a atividade..." value={novaTarefa.descricao} className="w-full bg-slate-100 p-5 rounded-2xl outline-none font-black text-slate-700 focus:ring-2 ring-red-100 transition-all border-none" onChange={e => setNovaTarefa({...novaTarefa, descricao: e.target.value})}/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic">Área Destino</label>
                  <input list="lista-area" required placeholder="Área" value={novaTarefa.area} className="w-full bg-slate-100 p-4 rounded-2xl outline-none font-bold text-sm border-none" onChange={e => setNovaTarefa({...novaTarefa, area: e.target.value})}/>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic">Responsável</label>
                  <input list="lista-responsavel" required placeholder="Quem executa?" value={novaTarefa.responsavel} className="w-full bg-slate-100 p-4 rounded-2xl outline-none font-bold text-sm border-none italic" onChange={e => setNovaTarefa({...novaTarefa, responsavel: e.target.value})}/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic">Projeto/Máquina</label>
                  <input list="lista-projeto" required placeholder="Projeto" value={novaTarefa.projeto} className="w-full bg-slate-100 p-4 rounded-2xl outline-none font-bold text-sm border-none" onChange={e => setNovaTarefa({...novaTarefa, projeto: e.target.value})}/>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic">Prazo Limite</label>
                  <input required type="date" value={novaTarefa.prazo} className="w-full bg-slate-100 p-4 rounded-2xl outline-none font-black text-red-600 border-none" onChange={e => setNovaTarefa({...novaTarefa, prazo: e.target.value})}/>
                </div>
              </div>

              <datalist id="lista-area">{listaConfigs.filter(c => c.tipo === 'area').map(o => <option key={o.id} value={o.valor}/>)}</datalist>
              <datalist id="lista-responsavel">{listaConfigs.filter(c => c.tipo === 'responsavel').map(o => <option key={o.id} value={o.valor}/>)}</datalist>
              <datalist id="lista-projeto">{listaConfigs.filter(c => c.tipo === 'projeto').map(o => <option key={o.id} value={o.valor}/>)}</datalist>

              <div className="space-y-2 mt-4">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic text-center block">Nível de Prioridade (0 = Urgente)</label>
                <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
                  {[0,1,2,3,4,5,6].map((num) => (
                    <button key={num} type="button" onClick={() => setNovaTarefa({...novaTarefa, prioridade: num})} className={`flex-1 py-4 rounded-xl font-black transition-all shadow-sm ${novaTarefa.prioridade === num ? getPriorityStyle(num, false) : "bg-white text-slate-300 hover:text-slate-500"}`}>{num}</button>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full bg-red-600 text-white py-6 rounded-[28px] font-black uppercase tracking-[0.2em] mt-6 shadow-2xl shadow-red-200 active:scale-[0.98] transition-all">Confirmar Registo</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}