import React, { useEffect, useRef, useState } from 'react';
import {
  getAssistantContext,
  getAssistantStatus,
  getStoredAntigravityToken,
  sendAssistantChat,
  setStoredAntigravityToken,
} from '../../api/client';
import type { AssistantChatMessage, AssistantStatus, AssistantStudentContext } from '../../api/types';
import { ClippitAnimation } from './ClippitAnimation';
import './clippy.css';

interface ClippitWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
}

const QUICK_ACTIONS = [
  'O que estudar hoje?',
  'Próximas provas',
  'Minhas faltas',
  'Tarefas atrasadas',
];

const INITIAL_MESSAGE: AssistantChatMessage = {
  role: 'assistant',
  content:
    'Olá! Eu sou o **Clippit**, seu copiloto acadêmico no EduTrack! 📎\n\n' +
    'Estou aqui para ajudar com suas disciplinas, tarefas, provas agendadas e controle de faltas. ' +
    'Como posso ajudar você hoje?',
  animation: 'wave',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

// Renderizador simples de Markdown retro (negrito, itálico, listas e quebras de linha)
function renderRetroMarkdown(content: string): React.ReactNode {
  const lines = content.split('\n');

  return lines.map((line, idx) => {
    // Títulos ###
    if (line.startsWith('### ')) {
      return (
        <h4 key={idx} className="font-bold text-xs uppercase tracking-wide mt-2 mb-1 text-slate-800">
          {line.replace('### ', '')}
        </h4>
      );
    }
    // Listas com hífen
    if (line.trim().startsWith('- ')) {
      const itemText = line.trim().substring(2);
      return (
        <div key={idx} className="flex items-start space-x-1.5 ml-2 my-0.5">
          <span className="text-slate-600 font-bold">•</span>
          <span>{parseInlineFormatting(itemText)}</span>
        </div>
      );
    }
    // Linha vazia
    if (!line.trim()) {
      return <div key={idx} className="h-1.5" />;
    }
    // Parágrafo padrão
    return (
      <p key={idx} className="my-0.5 leading-relaxed">
        {parseInlineFormatting(line)}
      </p>
    );
  });
}

function parseInlineFormatting(text: string): React.ReactNode {
  // Substitui **negrito** e `código`
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // Negrito
    const boldMatch = remaining.match(/(\*\*|__)(.*?)\1/);
    // Código
    const codeMatch = remaining.match(/`([^`]+)`/);

    const firstMatch = [
      boldMatch ? { type: 'bold', index: boldMatch.index!, match: boldMatch } : null,
      codeMatch ? { type: 'code', index: codeMatch.index!, match: codeMatch } : null,
    ]
      .filter(Boolean)
      .sort((a, b) => a!.index - b!.index)[0];

    if (!firstMatch) {
      parts.push(remaining);
      break;
    }

    if (firstMatch.index > 0) {
      parts.push(remaining.substring(0, firstMatch.index));
    }

    if (firstMatch.type === 'bold') {
      parts.push(
        <strong key={keyIndex++} className="font-semibold text-slate-900">
          {firstMatch.match[2]}
        </strong>
      );
      remaining = remaining.substring(firstMatch.index + firstMatch.match[0].length);
    } else if (firstMatch.type === 'code') {
      parts.push(
        <code
          key={keyIndex++}
          className="bg-slate-200 text-slate-800 text-[10px] px-1 py-0.5 rounded font-mono"
        >
          {firstMatch.match[1]}
        </code>
      );
      remaining = remaining.substring(firstMatch.index + firstMatch.match[0].length);
    }
  }

  return parts;
}

export const ClippitWindow: React.FC<ClippitWindowProps> = ({ isOpen, onClose, onMinimize }) => {
  const [messages, setMessages] = useState<AssistantChatMessage[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<string>('restpose');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customToken, setCustomToken] = useState<string>(() => getStoredAntigravityToken());
  const [statusInfo, setStatusInfo] = useState<AssistantStatus | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [studentContext, setStudentContext] = useState<AssistantStudentContext | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  // Carrega status ao abrir a janela ou o diálogo de configurações
  const refreshStatus = async (tokenOverride?: string) => {
    try {
      setStatusMessage('Verificando status...');
      const res = await getAssistantStatus(tokenOverride);
      setStatusInfo(res);
      if (res.configured) {
        setStatusMessage(`Conectado! Modo: ${res.mode} (${res.model})`);
      } else {
        setStatusMessage('Não configurado. Adicione um Access Token ou configure no .env.');
      }
    } catch {
      setStatusMessage('Não foi possível verificar status da API.');
    }
  };

  const handleOpenConfig = () => {
    setShowConfigModal(true);
    refreshStatus(customToken);
  };

  const handleSaveToken = () => {
    setStoredAntigravityToken(customToken);
    refreshStatus(customToken);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: AssistantChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);
    setCurrentAnimation('thinking');

    try {
      const historyPayload = newHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendAssistantChat({
        message: text,
        history: historyPayload,
      });

      const assistantMsg: AssistantChatMessage = {
        role: 'assistant',
        content: res.reply,
        animation: res.animation || 'writing',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setCurrentAnimation(res.animation || 'writing');
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'Falha na comunicação com o assistente.';
      const errorMsg: AssistantChatMessage = {
        role: 'assistant',
        content: `⚠️ **Ops! Não consegui processar a resposta:**\n${errorText}\n\nVerifique se suas credenciais do Antigravity estão ativas no botão ⚙ Configurar.`,
        animation: 'alert',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setCurrentAnimation('alert');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClippyClick = () => {
    const funAnimations = ['getattention', 'wave', 'congratulate', 'explain'];
    const randomAnim = funAnimations[Math.floor(Math.random() * funAnimations.length)];
    setCurrentAnimation(randomAnim);
  };

  const handleClearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setCurrentAnimation('restpose');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Janela Principal Retro Windows 98 */}
      <div
        className="win98-window fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[410px] max-w-[420px] h-[550px] max-h-[85vh] flex flex-col shadow-2xl text-[12px]"
        role="dialog"
        aria-label="Clippit - Assistente EduTrack"
      >
        {/* Barra de Título Windows 98 */}
        <div className="win98-title-bar">
          <div className="flex items-center space-x-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="text-sm">📎</span>
            <span>Clippit - Assistente EduTrack</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleOpenConfig}
              className="win98-btn win98-btn-title px-1.5 w-auto text-[10px]"
              title="Configurar Antigravity OAuth"
            >
              ⚙
            </button>
            {onMinimize && (
              <button
                onClick={onMinimize}
                className="win98-btn win98-btn-title"
                title="Minimizar"
              >
                _
              </button>
            )}
            <button
              onClick={onClose}
              className="win98-btn win98-btn-title"
              title="Fechar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Topo com avatar animado e banner */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#808080] bg-[#c0c0c0]">
          <div className="flex items-center space-x-2">
            <ClippitAnimation
              animation={currentAnimation}
              size={56}
              onClick={handleClippyClick}
              title="Clique para brincar com o Clippit!"
            />
            <div>
              <div className="font-bold text-xs text-slate-900">Clippit AI</div>
              <div className="text-[11px] text-slate-700">
                {isLoading ? 'Pensando com Gemini 3.8...' : 'Pronto para ajudar!'}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleClearChat}
              className="win98-btn text-[10px] px-2 py-0.5"
              title="Limpar histórico de mensagens"
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Botões de Ações Acadêmicas Rápidas */}
        <div className="px-2 py-1.5 bg-[#dfdfdf] border-b border-[#808080] flex flex-wrap gap-1">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              onClick={() => handleSendMessage(action)}
              disabled={isLoading}
              className="win98-btn text-[10px] py-0.5 px-1.5 whitespace-nowrap disabled:opacity-50"
            >
              {action}
            </button>
          ))}
        </div>

        {/* Área de Histórico de Mensagens */}
        <div className="win98-inset win98-scroll flex-1 p-2.5 overflow-y-auto space-y-2.5 m-1">
          {messages.map((msg, index) => {
            const isAssistant = msg.role === 'assistant';
            return (
              <div
                key={index}
                className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[88%] p-2 text-[11px] ${
                    isAssistant ? 'win98-chat-bubble-assistant' : 'win98-chat-bubble-user'
                  }`}
                >
                  {isAssistant && (
                    <div className="flex items-center space-x-1 text-[10px] text-slate-600 font-bold mb-1 border-b border-black/10 pb-0.5">
                      <span>📎 Clippit</span>
                    </div>
                  )}
                  <div>{renderRetroMarkdown(msg.content)}</div>
                  {msg.timestamp && (
                    <div className="text-[9px] text-slate-500 text-right mt-1">
                      {msg.timestamp}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex items-center space-x-2 win98-chat-bubble-assistant p-2 max-w-[70%]">
              <span className="animate-spin text-xs">⏳</span>
              <span className="text-[11px] text-slate-700 italic">Consultando seus dados acadêmicos...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Caixa de Entrada e Envio */}
        <div className="p-1.5 pt-0 flex flex-col space-y-1">
          <div className="flex space-x-1">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte sobre matérias, faltas, provas ou tarefas..."
              rows={2}
              disabled={isLoading}
              className="win98-inset flex-1 p-1 text-[11px] resize-none focus:outline-none"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputText.trim()}
              className="win98-btn px-3 font-bold text-xs disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-600 px-1">
            <span>Enter envia • Shift+Enter nova linha</span>
            <span className="text-[9px] text-slate-500">Gemini 3.8 Flash via Antigravity</span>
          </div>
        </div>
      </div>

      {/* Modal Retro de Configuração do Antigravity OAuth */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="win98-window w-full max-w-md shadow-2xl">
            <div className="win98-title-bar">
              <div className="flex items-center space-x-1">
                <span>⚙</span>
                <span>Configurações do Antigravity OAuth</span>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="win98-btn win98-btn-title"
              >
                ✕
              </button>
            </div>
            <div className="p-3 space-y-3 text-[11px]">
              <p className="leading-relaxed">
                O assistente utiliza o modelo <strong>Gemini 3.8 Flash</strong> através do gateway unificado
                do <strong>Google Antigravity</strong> com autenticação OAuth2.
              </p>
              <div className="bg-[#dfdfdf] p-2 border border-[#808080]">
                <label className="block font-bold mb-1">Access Token Individual (Override):</label>
                <textarea
                  value={customToken}
                  onChange={(e) => setCustomToken(e.target.value)}
                  placeholder="Cole seu Bearer token aqui (ou deixe em branco para usar as variáveis globais do .env)..."
                  rows={3}
                  className="win98-inset w-full p-1 text-[10px] font-mono resize-none focus:outline-none"
                />
                <div className="text-[10px] text-slate-600 mt-1">
                  Se preenchido, será enviado no cabeçalho <code>X-Antigravity-Token</code>.
                </div>
              </div>

              {statusInfo && (
                <div className="flex items-center justify-between text-[10px] text-slate-700 bg-slate-100 p-1.5 border border-[#808080]">
                  <span>Modelo: <strong>{statusInfo.model}</strong></span>
                  <span>Modo: <span className="font-mono">{statusInfo.mode}</span></span>
                  <span>{statusInfo.configured ? '🟢 Configurado' : '⚪ Não configurado'}</span>
                </div>
              )}

              {statusMessage && (
                <div className="p-1.5 bg-[#ffffea] border border-black text-[10px]">
                  <strong>Status:</strong> {statusMessage}
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-[#808080]">
                <button
                  onClick={async () => {
                    setIsLoadingContext(true);
                    try {
                      const ctx = await getAssistantContext();
                      setStudentContext(ctx);
                    } catch {
                      setStatusMessage('Falha ao carregar contexto acadêmico.');
                    } finally {
                      setIsLoadingContext(false);
                    }
                  }}
                  className="win98-btn px-2 text-[10px]"
                  disabled={isLoadingContext}
                >
                  {isLoadingContext ? 'Carregando...' : '🔍 Auditar Contexto'}
                </button>
                <div className="flex space-x-1.5">
                  <button
                    onClick={() => refreshStatus(customToken)}
                    className="win98-btn px-2"
                  >
                    Testar Status
                  </button>
                  <button
                    onClick={handleSaveToken}
                    className="win98-btn px-2 font-bold"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setShowConfigModal(false);
                      setStudentContext(null);
                    }}
                    className="win98-btn px-2"
                  >
                    Fechar
                  </button>
                </div>
              </div>

              {studentContext && (
                <div className="mt-2 p-2 win98-inset win98-scroll max-h-40 overflow-y-auto font-mono text-[9px] bg-slate-50">
                  <div className="font-bold text-slate-800 mb-1">Dados Sincronizados do Aluno:</div>
                  <div>Estudante: {studentContext.student.full_name} ({studentContext.student.course})</div>
                  <div>Disciplinas ativas: {studentContext.subjects.length}</div>
                  <div>Tarefas pendentes: {studentContext.tasks.pending.length}</div>
                  <div>Tarefas atrasadas: {studentContext.tasks.overdue.length}</div>
                  <div>Provas em 30 dias: {studentContext.upcoming_events.length}</div>
                  <div>Leituras em andamento: {studentContext.readings.length}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
