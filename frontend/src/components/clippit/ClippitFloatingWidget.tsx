import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
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
  const [greetingText] = useState(initialGreeting);
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
        {/* Balão de diálogo proativo estilo Office 97 moderno */}
        {!isOpen && showBalloon && (
          <div
            onClick={handleToggleOpen}
            className="office97-speech-balloon mb-3 p-3 max-w-[230px] text-xs cursor-pointer hover:scale-102 transition-all relative select-none"
            role="alert"
          >
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center space-x-1">
                <span className="text-xs">📎</span>
                <span className="font-bold text-xs text-amber-950 dark:text-amber-200">Clippit</span>
              </div>
              <button
                onClick={handleDismissBalloon}
                className="text-amber-700/60 hover:text-amber-950 dark:text-amber-400/60 dark:hover:text-amber-200 text-xs ml-1 p-0.5 rounded-md hover:bg-amber-200/50 transition-colors cursor-pointer"
                title="Fechar dica"
                aria-label="Fechar balão"
              >
                <X className="size-3" />
              </button>
            </div>
            <p className="leading-snug text-xs text-slate-800 dark:text-amber-100">{greetingText}</p>
          </div>
        )}

        {/* Avatar flutuante clicável em pedestal moderno */}
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
          <div className="relative p-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/90 dark:border-slate-700/80 shadow-xl group-hover:shadow-2xl group-hover:scale-105 active:scale-95 transition-all duration-300">
            <div className="clippy-floating-avatar">
              <ClippitAnimation
                animation={isOpen ? 'restpose' : widgetAnimation}
                size={84}
                className="drop-shadow-md"
              />
            </div>
            <span className="absolute bottom-1.5 right-1.5 flex size-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-3 bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </span>
          </div>
        </div>
      </div>

      {/* Janela de Chat Moderna do Clippit */}
      <ClippitWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onMinimize={() => setIsOpen(false)}
      />
    </>
  );
};
