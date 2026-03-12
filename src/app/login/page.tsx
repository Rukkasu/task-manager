"use client";
import { useState } from "react";
import pb from "@/lib/pocketbase"; 
import { useRouter } from "next/navigation";
import "./login.css"; // Importando o seu novo arquivo de estilos

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      if (isRegister) {
        if (password !== passwordConfirm) {
          setErro("As senhas não coincidem.");
          setLoading(false);
          return;
        }

        const data = {
          email,
          password,
          passwordConfirm,
          emailVisibility: true,
          name: email.split('@')[0],
        };

        await pb.collection("users").create(data);
        await pb.collection("users").authWithPassword(email, password);
      } else {
        await pb.collection("users").authWithPassword(email, password);
      }

      router.push("/");
      router.refresh(); 
    } catch (error: any) {
      setErro(isRegister ? "Erro ao criar conta. Tente novamente." : "E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-card">
        <h1 className="login-title">Industrial Hub</h1>
        <p className="login-subtitle">
          {isRegister ? "Crie sua conta de operador" : "Acesse o painel de produção"}
        </p>
        
        {erro && <div className="login-error-box">{erro}</div>}

        <div className="login-form-group">
          <div className="login-input-wrapper">
            <label className="login-label">E-mail</label>
            <input
              type="email"
              placeholder="exemplo@empresa.com"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-input-wrapper">
            <label className="login-label">Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {isRegister && (
            <div className="login-input-wrapper">
              <label className="login-label">Confirmar Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                className="login-input"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
              />
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="login-button-main">
          {loading ? "Processando..." : isRegister ? "Criar Conta" : "Entrar"}
        </button>

        <button
          type="button"
          onClick={() => { setIsRegister(!isRegister); setErro(""); }}
          className="login-toggle-btn"
        >
          {isRegister ? "Já possui conta? Entre aqui" : "Primeiro acesso? Registre-se agora"}
        </button>
      </form>
      
      <p className="login-footer-tag">Sistema de Gestão Industrial v1.0</p>
    </div>
  );
}