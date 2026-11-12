import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Smartphone } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Cài app vào máy</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Cài vào iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-white">
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                Cài đặt lên màn hình iPhone/iPad
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                1. Bấm nút <strong>Chia sẻ (Share)</strong> hình mũi tên vuông ở thanh dưới Safari.<br />
                2. Cuộn xuống chọn <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong>.<br />
                3. Icon game sẽ xuất hiện ngay trên điện thoại như một ứng dụng thực thụ!
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-cyan-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for browsers: provide guided installation button
  return (
    <button
      onClick={() => setShowIOSGuide(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/40 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
    >
      <Download className="w-3.5 h-3.5" />
      <span>Cài đặt App</span>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-white text-left">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              Cài Web Game về điện thoại
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              • <strong>Trên Android / Chrome:</strong> Bấm biểu tượng 3 chấm ở góc phải &rarr; chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào màn hình chính"</strong>.<br /><br />
              • <strong>Trên iPhone / Safari:</strong> Bấm nút <strong>Chia sẻ (Share)</strong> &rarr; chọn <strong>"Thêm vào MH chính"</strong>.
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
            >
              Đóng hướng dẫn
            </button>
          </div>
        </div>
      )}
    </button>
  );
};
