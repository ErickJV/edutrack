import React, { useEffect, useRef, useState } from 'react';
import { Minus, RotateCcw, Send, X } from 'lucide-react';
import { sendAssistantChat } from '../../api/client';
import type { AssistantChatMessage } from '../../api/types';
import { ClippitAnimation } from './ClippitAnimation';
import './clippy.css';

interface ClippitWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
}

const QUICK_ACTIONS = [
  { label: 'O que estudar hoje?', icon: '📚' },
  { label: 'Próximas provas', icon: '📅' },
  { label: 'Minhas faltas', icon: '⚠️' },
  { label: 'Tarefas atrasadas', icon: '⏳' },
];

const INITIAL_MESSAGE: AssistantChatMessage = {
  role: 'assistant',
  content:
    'Olá! Eu sou o **Clippit**, seu copiloto acadêmico no Impatrack! 📎\n\n' +
    'Estou aqui para ajudar com suas disciplinas, tarefas, provas agendadas e controle de faltas. ' +
    'Como posso ajudar você hoje?',
  animation: 'wave',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

// Renderizador aprimorado de Markdown mantendo o feeling nostálgico com tipografia moderna
function renderRetroMarkdown(content: string): React.ReactNode {
  const lines = content.split('\n');

  return lines.map((line, idx) => {
    // Títulos ###
    if (line.startsWith('### ')) {
      return (
        <h4
          key={idx}
          className="font-bold text-xs uppercase tracking-wider mt-2.5 mb-1 text-[#0d3950] dark:text-[#a8d5e5] border-b border-slate-200/70 dark:border-[#005063]/30 pb-0.5"
        >
          {line.replace('### ', '')}
        </h4>
      );
    }
    // Títulos ##
    if (line.startsWith('## ')) {
      return (
        <h3
          key={idx}
          className="font-extrabold text-sm text-[#0d3950] dark:text-[#a8d5e5] mt-2.5 mb-1 border-b border-slate-200/70 dark:border-[#005063]/30 pb-0.5"
        >
          {line.replace('## ', '')}
        </h3>
      );
    }
    // Listas com hífen ou asterisco
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const itemText = line.trim().substring(2);
      return (
        <div key={idx} className="flex items-start space-x-2 ml-1 my-1">
          <span className="text-[#006768] dark:text-cyan-300 font-bold leading-relaxed shrink-0">•</span>
          <span className="leading-relaxed">{parseInlineFormatting(itemText)}</span>
        </div>
      );
    }
    // Listas numeradas (ex: 1. 2.)
    const numberedMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      return (
        <div key={idx} className="flex items-start space-x-2 ml-1 my-1">
          <span className="text-[#006768] dark:text-cyan-300 font-bold text-xs leading-relaxed shrink-0">
            {numberedMatch[1]}.
          </span>
          <span className="leading-relaxed">{parseInlineFormatting(numberedMatch[2])}</span>
        </div>
      );
    }
    // Linha vazia
    if (!line.trim()) {
      return <div key={idx} className="h-1.5" />;
    }
    // Parágrafo padrão
    return (
      <p key={idx} className="my-1 leading-relaxed">
        {parseInlineFormatting(line)}
      </p>
    );
  });
}

function parseInlineFormatting(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/(\*\*|__)(.*?)\1/);
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
        <strong key={keyIndex++} className="font-bold text-slate-900 dark:text-white">
          {firstMatch.match[2]}
        </strong>
      );
      remaining = remaining.substring(firstMatch.index + firstMatch.match[0].length);
    } else if (firstMatch.type === 'code') {
      parts.push(
        <code
          key={keyIndex++}
          className="bg-slate-100 dark:bg-[#041019] text-[#0d3950] dark:text-slate-100 text-[11px] px-1.5 py-0.5 rounded-md font-mono border border-slate-200/80 dark:border-[#005063]/40"
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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

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
        content: `⚠️ **Ops! Não consegui processar a resposta:**\n${errorText}\n\nVerifique sua conexão e tente novamente.`,
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
    <div
      className="clippy-window-animate fixed bottom-24 right-4 sm:right-6 z-50 w-[94vw] sm:w-[420px] max-w-[440px] h-[580px] max-h-[85vh] flex flex-col rounded-3xl bg-white/95 dark:bg-[#0c1824]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700/80 shadow-2xl shadow-indigo-950/20 dark:shadow-black/70 overflow-hidden text-xs"
      role="dialog"
      aria-label="Clippit - Assistente Impatrack"
    >
      {/* Barra de Título Moderna com Feeling Nostálgico */}
      <div className="bg-gradient-to-r from-[#005063] via-[#0d3950] to-[#1e3a8a] text-white px-4 py-2.5 flex items-center justify-between select-none border-b border-white/10 shrink-0">
        <div className="flex items-center space-x-2">
          <span className="flex items-center justify-center size-6 rounded-lg bg-white/15 text-white/80 text-xs shadow-2xs">
            📎
          </span>
          <span className="font-bold tracking-tight text-sm">Clippit AI</span>
        </div>
        <div className="flex items-center space-x-1.5">
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="size-7 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
              title="Minimizar"
              aria-label="Minimizar assistente"
            >
              <Minus className="size-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="size-7 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-rose-500/80 active:scale-95 transition-all cursor-pointer"
            title="Fechar"
            aria-label="Fechar assistente"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Hero do Clippy com Avatar Interativo e Status */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/60 dark:to-[#0c1824] border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
        <div className="flex items-center space-x-3">
          <div
            className="relative group cursor-pointer"
            onClick={handleClippyClick}
            title="Clique para ver animações do Clippit!"
          >
            <div className="size-13 rounded-2xl bg-white dark:bg-[#041019] p-1 flex items-center justify-center border border-slate-200/90 dark:border-[#005063]/40 shadow-xs group-hover:scale-105 active:scale-95 transition-transform">
              <ClippitAnimation
                animation={currentAnimation}
                size={48}
                className="drop-shadow-xs"
              />
            </div>
          </div>
          <div>
            <span className="font-bold text-xs text-slate-800 dark:text-white">Assistente de Estudos</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isLoading ? 'Organizando sua resposta...' : 'Pronto para tirar dúvidas e organizar sua rotina'}
            </p>
          </div>
        </div>
        <button
          onClick={handleClearChat}
          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer"
          title="Limpar histórico de mensagens"
        >
          <RotateCcw className="size-3" />
          <span>Limpar</span>
        </button>
      </div>

      {/* Sugestões Rápidas de Ações Acadêmicas */}
      <div className="px-3 py-2 bg-slate-50/60 dark:bg-slate-900/30 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center gap-1.5 overflow-x-auto clippy-scroll shrink-0">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => handleSendMessage(action.label)}
            disabled={isLoading}
            className="inline-flex items-center space-x-1 text-[11px] font-medium py-1 px-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs hover:bg-[#005063]/5 hover:text-[#0d3950] hover:border-[#005063]/40 dark:hover:bg-[#005063]/20 dark:hover:text-white dark:hover:border-[#005063] transition-all whitespace-nowrap disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            <span>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Área de Histórico de Mensagens */}
      <div className="clippy-scroll flex-1 p-3.5 overflow-y-auto space-y-3">
        {messages.map((msg, index) => {
          const isAssistant = msg.role === 'assistant';
          return (
            <div
              key={index}
              className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[88%] p-3 text-[12px] ${
                  isAssistant ? 'clippy-bubble-assistant' : 'clippy-bubble-user'
                }`}
              >
                {isAssistant && (
                  <div className="flex items-center space-x-1.5 text-[10px] font-bold text-[#0d3950] dark:text-cyan-300 mb-1.5 pb-1 border-b border-slate-200/70 dark:border-[#005063]/40">
                    <span>📎</span>
                    <span>Clippit</span>
                  </div>
                )}
                <div>{renderRetroMarkdown(msg.content)}</div>
                {msg.timestamp && (
                  <div
                    className={`text-[9px] mt-1 text-right ${
                      isAssistant ? 'text-slate-400 dark:text-slate-500' : 'text-white/60'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex items-center space-x-2 clippy-bubble-assistant p-3 max-w-[78%]">
            <span className="size-2 rounded-full bg-[#006768] animate-ping" />
            <span className="text-[11px] text-slate-600 dark:text-slate-300 italic">
              Clippit está consultando seus dados acadêmicos...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Caixa de Entrada e Envio */}
      <div className="p-3 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800/80 shrink-0">
        <div className="flex items-end space-x-2 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-1.5 shadow-2xs focus-within:ring-2 focus-within:ring-[#005063]/30 focus-within:border-[#005063] dark:focus-within:ring-[#2dd4bf]/30 dark:focus-within:border-[#2dd4bf] transition-all">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre matérias, faltas, provas ou tarefas..."
            rows={2}
            disabled={isLoading}
            className="flex-1 bg-transparent p-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none resize-none leading-relaxed"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputText.trim()}
            className="size-9 rounded-xl bg-gradient-to-r from-[#005063] to-[#006768] hover:from-[#0d3950] hover:to-[#005063] text-white flex items-center justify-center shadow-xs disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
            title="Enviar mensagem"
            aria-label="Enviar mensagem"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
