import React from 'react';
import { X, Globe, UploadCloud, RefreshCw, Smartphone, DollarSign, CheckCircle2 } from 'lucide-react';

interface DeploymentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeploymentGuideModal: React.FC<DeploymentGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white">
              Cẩm Nang Tạo Web Game & Cập Nhật Thường Xuyên
            </h3>
            <p className="text-xs text-slate-400">
              Chi phí 0 VNĐ · Không cần máy Mac · Cập nhật tức thì cho người chơi toàn cầu
            </p>
          </div>
        </div>

        <div className="space-y-4 mt-6 text-xs text-slate-300">
          {/* Card 1: Chuẩn bị gì */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <h4 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              1. Những thứ bạn cần chuẩn bị (Rất ít và miễn phí)
            </h4>
            <div className="space-y-2 leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Tài khoản GitHub (Miễn phí):</strong> Dùng để lưu trữ mã nguồn của bạn trực tuyến.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Tài khoản Vercel hoặc Netlify (Miễn phí 100%):</strong> Nền tảng hosting tốc độ cao, hỗ trợ tên miền có sẵn (ví dụ: <code className="text-cyan-400">khutrochoi.vercel.app</code>) và chứng chỉ bảo mật HTTPS tự động.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Tên miền riêng (Tùy chọn):</strong> Nếu muốn tên miền đẹp như <code className="text-cyan-400">gamehay.vn</code> hay <code className="text-cyan-400">arcadegame.com</code>, bạn có thể mua (~150k - 250k VNĐ/năm). Nếu không, dùng tên miền miễn phí của Vercel vẫn cực kỳ chuyên nghiệp.
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Các bước đưa lên mạng */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <h4 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              2. Các bước đưa trang web lên mạng (Chỉ mất 5 phút)
            </h4>
            <ol className="space-y-2 list-decimal list-inside leading-relaxed text-slate-300">
              <li>
                Tạo một kho lưu trữ (Repository) trên <span className="text-white font-medium">GitHub.com</span> và tải toàn bộ code dự án này lên.
              </li>
              <li>
                Truy cập <span className="text-white font-medium">Vercel.com</span> (hoặc Netlify.com), đăng nhập bằng tài khoản GitHub.
              </li>
              <li>
                Bấm <span className="text-cyan-300 font-semibold">"Add New Project"</span> &rarr; Chọn Repository vừa tạo &rarr; Bấm <span className="text-emerald-400 font-semibold">"Deploy"</span>.
              </li>
              <li>
                Sau 30 giây, Vercel sẽ cấp cho bạn một đường link web chính thức để bạn gửi cho bạn bè hoặc người chơi ở bất kỳ đâu!
              </li>
            </ol>
          </div>

          {/* Card 3: Quy trình cập nhật game */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <h4 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-amber-400" />
              3. Cách bạn cập nhật thêm trò chơi thường xuyên
            </h4>
            <div className="space-y-2 leading-relaxed">
              <p>
                <strong className="text-white">Cách 1 (Ngay trên giao diện web):</strong> Sử dụng nút <span className="text-emerald-400 font-semibold">"Thêm game mới"</span> trên thanh menu của trang web để nhúng các game HTML5 từ itch.io, CrazyGames hoặc các kho game mở.
              </p>
              <p>
                <strong className="text-white">Cách 2 (Thêm game code mới):</strong> Khi bạn viết thêm game mới (hoặc nhờ AI viết giúp thêm game Flappy Bird, Cờ Ca-rô, Đua xe, Bắn bóng,...), bạn chỉ cần commit code lên GitHub. Vercel sẽ <span className="text-emerald-400 font-semibold">tự động cập nhật web sau 30 giây</span>. Hàng nghìn người chơi mở web lên là thấy game mới ngay lập tức!
              </p>
            </div>
          </div>

          {/* Card 4: Thay thế App Store bằng PWA */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <h4 className="text-sm font-semibold text-emerald-300 mb-2 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              4. Cho người chơi cài app về điện thoại không cần App Store
            </h4>
            <p className="leading-relaxed">
              Trang web đã được tích hợp công nghệ <span className="text-white font-semibold">PWA (Progressive Web App)</span>. Người chơi vào bằng Safari (trên iPhone) hoặc Chrome (trên Android) chỉ cần bấm <span className="text-cyan-300 font-semibold">"Thêm vào Màn hình chính"</span> là icon game sẽ xuất hiện trên màn hình điện thoại, mở ra chơi toàn màn hình không có thanh địa chỉ web, trải nghiệm giống hệt một app 100%!
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <a
            href="/arcade-games-hub.zip"
            download="arcade-games-hub.zip"
            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Tải File Nén Toàn Bộ Mã Nguồn (.zip)
          </a>

          <button
            onClick={onClose}
            className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
