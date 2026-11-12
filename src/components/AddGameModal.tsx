import React, { useState } from 'react';
import { GameItem } from '../types';
import { X, Plus, Sparkles, Link2 } from 'lucide-react';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGame: (game: GameItem) => void;
}

export const AddGameModal: React.FC<AddGameModalProps> = ({
  isOpen,
  onClose,
  onAddGame
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'action' | 'arcade' | 'puzzle'>('arcade');
  const [description, setDescription] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tên trò chơi');
      return;
    }
    if (!embedUrl.trim() || !embedUrl.startsWith('http')) {
      setError('Vui lòng nhập đường link URL hợp lệ (bắt đầu bằng https://)');
      return;
    }

    const newGame: GameItem = {
      id: `custom_${Date.now()}`,
      title: title.trim(),
      category: category,
      description: description.trim() || 'Trò chơi mới được thêm vào thư viện.',
      plays: 1,
      rating: 5.0,
      iconType: 'custom',
      embedUrl: embedUrl.trim(),
      isCustom: true,
      badge: 'Mới'
    };

    onAddGame(newGame);
    setTitle('');
    setDescription('');
    setEmbedUrl('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold tracking-tight mb-1 flex items-center gap-2 text-white">
          <Plus className="w-5 h-5 text-emerald-400" />
          Thêm Trò Chơi Mới Vào Cổng Game
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Nhập thông tin hoặc link game HTML5 để bổ sung trò chơi mới vào bộ sưu tập của bạn bất cứ lúc nào.
        </p>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Tên trò chơi *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Đua Xe Cổ Điển, Cờ Ca-rô,..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Thể loại
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as 'action' | 'arcade' | 'puzzle')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="arcade">Arcade & Cổ điển</option>
              <option value="action">Hành động & Bắn súng</option>
              <option value="puzzle">Trí tuệ & Câu đố</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-cyan-400" />
              Đường link game HTML5 (iFrame URL) *
            </label>
            <input
              type="url"
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Gợi ý: Link game HTML5 từ itch.io, GitHub Pages, hoặc trang game web bất kỳ.
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Mô tả ngắn
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả cách chơi hoặc nội dung..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Lưu & Thêm Vào Thư Viện
          </button>
        </form>
      </div>
    </div>
  );
};
