import React, { useEffect, useRef, useState } from 'react';
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
        content: `⚠️ **Ops! Não consegui processar a resposta:**\n${errorText}\n\nVerifique se o seu ambiente possui credenciais ativas do Antigravity ou oh-my-pi (.omp).`,
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
            size={64}
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
      </div>
    </div>
  );
};
