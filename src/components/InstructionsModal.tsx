import React from 'react';
import { GameDifficulty, GameType } from '../types';
import { X, Keyboard, MousePointer, Smartphone, Shield, Zap, Sparkles } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeGame: GameType;
  difficulty: GameDifficulty;
  onSelectDifficulty: (diff: GameDifficulty) => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({
  isOpen,
  onClose,
  activeGame,
  difficulty,
  onSelectDifficulty
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold tracking-tight mb-1 flex items-center gap-2 text-white">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          Hướng Dẫn & Cài Đặt Trò Chơi
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Tùy chỉnh độ khó và xem cách điều khiển mượt mà nhất trên máy tính hoặc điện thoại.
        </p>

        {/* Difficulty Selection */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            MỨC ĐỘ KHÓ
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['easy', 'normal', 'hard'] as GameDifficulty[]).map((d) => {
              const label = d === 'easy' ? 'Dễ' : d === 'normal' ? 'Vừa' : 'Khó';
              const active = difficulty === d;
              return (
                <button
                  key={d}
                  onClick={() => onSelectDifficulty(d)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    active
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Game specific guidelines */}
        <div className="space-y-4">
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
            <h4 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-2">
              <Keyboard className="w-4 h-4" /> Bàn phím máy tính
            </h4>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li><span className="font-medium text-white">Mũi tên / WASD:</span> Di chuyển nhân vật / thanh trượt.</li>
              <li><span className="font-medium text-white">Phím Cách (Space):</span> Bắn đạn (game phi thuyền).</li>
              <li><span className="font-medium text-white">Phím B:</span> Kích hoạt Bom EMP diệt toàn màn hình.</li>
              <li><span className="font-medium text-white">Phím P:</span> Tạm dừng hoặc tiếp tục chơi.</li>
            </ul>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
            <h4 className="text-sm font-semibold text-emerald-300 mb-2 flex items-center gap-2">
              <MousePointer className="w-4 h-4" /> Chuột & Màn hình cảm ứng
            </h4>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li><span className="font-medium text-white">Di chuyển chuột hoặc vuốt ngón tay:</span> Phi thuyền và thanh trượt bám sát vị trí chạm.</li>
              <li><span className="font-medium text-white">Bàn phím ảo D-Pad:</span> Điều khiển rắn đổi hướng nhanh chóng.</li>
            </ul>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
            <h4 className="text-sm font-semibold text-rose-300 mb-2 flex items-center gap-2">
              <span>🎯</span> Cờ Ca-rô & Cờ Tướng
            </h4>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li><span className="font-medium text-white">Cờ Ca-rô:</span> Tạo chuỗi 5 quân liên tiếp (ngang, dọc, chéo) để chiến thắng. Hỗ trợ đấu với Máy hoặc 2 Người.</li>
              <li><span className="font-medium text-white">Cờ Tướng:</span> Bấm vào quân cờ để xem gợi ý các chấm xanh lá có thể đi. Luật chuẩn: Mã có cản chân, Tượng cản mắt, Pháo cần ngòi nhảy, Tướng trong Cung. Bắt Tướng đối phương để thắng!</li>
            </ul>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-colors cursor-pointer"
        >
          Đã Hiểu, Quay Lại Chơi
        </button>
      </div>
    </div>
  );
};
