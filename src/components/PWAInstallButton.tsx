import React, {useState} from 'react';
import {Download, X} from 'lucide-react';
import {usePWAInstall} from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({compact = false}) => {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = () => {
    if (isInstallable) {
      install();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          compact
            ? 'min-h-[32px] px-3 py-1 rounded-lg border border-[#D4AF37]/50 bg-[#1A1711] hover:bg-[#242018] text-xs font-medium text-[#E8CA68] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer'
            : 'min-h-[40px] px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#E8CA68] text-[#090806] text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer'
        }
      >
        <Download className="w-3.5 h-3.5" />
        <span>Download App</span>
      </button>

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4">
          <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl bg-[#12100C] border border-[#2B251A] p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-[#F5EFE2]">
                  Download حسنات on Your Device
                </h3>
                <p className="text-xs text-[#8B816E] mt-0.5">
                  Install once for offline Quran, Qibla, Salah &amp; Adhkar access
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="Close download guide"
                className="w-9 h-9 rounded-xl bg-[#1A1711] border border-[#2B251A] text-[#C7BDA8] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="rounded-2xl bg-[#090806] border border-[#2B251A] p-4 text-sm text-[#C7BDA8] leading-relaxed space-y-2">
                <p className="font-semibold text-[#E8CA68]">iPhone &amp; iPad (Safari)</p>
                <p>1. Open this app directly in Safari (outside embedded previews).</p>
                <p>2. Tap the <strong className="text-[#F5EFE2]">Share</strong> icon in Safari’s toolbar.</p>
                <p>3. Scroll down and tap <strong className="text-[#F5EFE2]">Add to Home Screen</strong>.</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-[#C7BDA8] leading-relaxed">
                <div className="rounded-2xl bg-[#090806] border border-[#2B251A] p-3.5 space-y-1">
                  <p className="font-semibold text-[#E8CA68]">Android (Chrome / Edge)</p>
                  <p>Open the live link in Chrome → tap the menu (⋮) → <strong className="text-[#F5EFE2]">Install app</strong> or <strong className="text-[#F5EFE2]">Add to Home screen</strong>.</p>
                </div>
                <div className="rounded-2xl bg-[#090806] border border-[#2B251A] p-3.5 space-y-1">
                  <p className="font-semibold text-[#E8CA68]">Windows &amp; macOS (Chrome / Edge)</p>
                  <p>Click the <strong className="text-[#F5EFE2]">Install icon</strong> on the right side of the browser address bar to install as a standalone desktop app.</p>
                </div>
                <div className="rounded-2xl bg-[#090806] border border-[#2B251A] p-3.5 space-y-1">
                  <p className="font-semibold text-[#E8CA68]">iPhone &amp; iPad (Safari)</p>
                  <p>Tap <strong className="text-[#F5EFE2]">Share → Add to Home Screen</strong> in Safari.</p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full min-h-[44px] rounded-xl bg-[#D4AF37] text-[#090806] text-sm font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
