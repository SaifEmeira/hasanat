import React, {useState} from 'react';
import {Download} from 'lucide-react';
import {usePWAInstall} from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  fallbackAction?: React.ReactNode;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({fallbackAction}) => {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return <>{fallbackAction ?? null}</>;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="min-h-[40px] px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#E8CA68] text-[#090806] text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#E8CA68] text-[#090806] text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl bg-[#12100C] border border-[#2B251A] p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-semibold text-[#F5EFE2]">
                Install حسنات on iPhone / iPad
              </h3>
              <p className="text-sm text-[#C7BDA8] leading-relaxed">
                1. Tap the <strong className="text-[#E8CA68]">Share</strong> button in the Safari toolbar.
                <br />
                2. Scroll down and tap{' '}
                <strong className="text-[#E8CA68]">Add to Home Screen</strong> for offline access to Quran, Qibla &amp; Adhkar.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[44px] rounded-xl bg-[#D4AF37] text-[#090806] text-sm font-semibold cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return <>{fallbackAction ?? null}</>;
};
