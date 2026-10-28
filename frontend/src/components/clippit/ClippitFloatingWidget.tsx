import React, { useEffect, useState } from 'react';
import { ClippitAnimation } from './ClippitAnimation';
import { ClippitWindow } from './ClippitWindow';
import './clippy.css';

interface ClippitFloatingWidgetProps {
  initialGreeting?: string;
}

export const ClippitFloatingWidget: React.FC<ClippitFloatingWidgetProps> = ({
  initialGreeting = 'Olá! Precisa de ajuda com suas matérias ou tarefas?',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showBalloon, setShowBalloon] = useState(true);
  const [greetingText, setGreetingText] = useState(initialGreeting);
  const [widgetAnimation, setWidgetAnimation] = useState<string>('wave');

  useEffect(() => {
    // Balão inicial fica visível por 10 segundos ou até interação
    const timer = setTimeout(() => {
      setShowBalloon(false);
      setWidgetAnimation('restpose');
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleToggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setShowBalloon(false);
        setWidgetAnimation('restpose');
      }
      return next;
    });
  };

  const handleDismissBalloon = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBalloon(false);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end select-none">
        {/* Balão de diálogo proativo estilo Office 97 */}
        {!isOpen && showBalloon && (
          <div
            onClick={handleToggleOpen}
            className="office97-speech-balloon mb-2 p-2.5 max-w-[210px] text-xs cursor-pointer hover:bg-[#ffffcc] transition-colors relative"
            role="alert"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-bold text-[11px] text-slate-800">Clippit</span>
              <button
                onClick={handleDismissBalloon}
                className="text-slate-500 hover:text-black text-[10px] ml-1 px-1 font-bold"
                title="Fechar dica"
              >
                ✕
              </button>
            </div>
            <p className="leading-tight text-[11px] text-slate-900">{greetingText}</p>
          </div>
        )}

        {/* Avatar flutuante clicável */}
        <div
          onClick={handleToggleOpen}
          className="relative group cursor-pointer focus:outline-none"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggleOpen();
            }
          }}
          title={isOpen ? 'Minimizar Clippit' : 'Abrir assistente Clippit'}
        >
          <div className="p-1 rounded-full bg-white/20 backdrop-blur-xs transition-all duration-200 group-hover:scale-105 group-hover:bg-white/40">
            <ClippitAnimation
              animation={isOpen ? 'restpose' : widgetAnimation}
              size={76}
              className="drop-shadow-xl"
            />
          </div>
          {/* Badge de status IA */}
          <span className="absolute bottom-1 right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-600 border-2 border-white" />
          </span>
        </div>
      </div>

      {/* Janela estilo Windows 98 do Clippit */}
      <ClippitWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onMinimize={() => setIsOpen(false)}
      />
    </>
  );
};
