import React from 'react';
import { ExternalLink, RotateCcw } from 'lucide-react';

interface CustomEmbedGameProps {
  title: string;
  embedUrl: string;
}

export const CustomEmbedGame: React.FC<CustomEmbedGameProps> = ({ title, embedUrl }) => {
  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      <div className="w-full max-w-[700px] mb-3 flex items-center justify-between text-sm bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200">
        <span className="font-semibold text-white">{title}</span>
        <a
          href={embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
        >
          Mở tab riêng <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="relative w-full max-w-[700px] aspect-[4/3] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
};
