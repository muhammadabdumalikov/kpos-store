"use client";

type PolicyDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function PolicyDrawer({ open, onClose }: PolicyDrawerProps) {
  if (!open) return null;

  return (
    <>
      <label
        htmlFor="policy-drawer-checkbox"
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        aria-hidden
      />
      <nav
        role="dialog"
        aria-modal="true"
        aria-label="Shaxsiy ma'lumotlar siyosati"
        className="fixed bottom-0 right-0 top-0 z-50 w-full max-w-[400px] transform bg-white dark:bg-gray-900 shadow-xl lg:max-w-md"
      >
        <div className="flex h-full flex-col bg-white dark:bg-gray-900">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">Shaxsiy ma&apos;lumotlar siyosati</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 hover:text-gray-700 dark:text-gray-300"
              aria-label="Yopish"
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="h-6 w-6">
                <path opacity="0.4" d="M25.6673 13.9997C25.6673 20.443 20.444 25.6663 14.0007 25.6663C7.55733 25.6663 2.33398 20.443 2.33398 13.9997C2.33398 7.55635 7.55733 2.33301 14.0007 2.33301C20.444 2.33301 25.6673 7.55635 25.6673 13.9997Z" fill="#9AA0A6" />
                <path fillRule="evenodd" clipRule="evenodd" d="M10.0813 16.6821C9.73963 17.0238 9.73963 17.5778 10.0813 17.9196C10.423 18.2613 10.9771 18.2613 11.3188 17.9196L13.9994 15.2389L16.6802 17.9197C17.0219 18.2614 17.5759 18.2614 17.9176 17.9197C18.2593 17.578 18.2593 17.024 17.9176 16.6822L15.2368 14.0015L17.9184 11.3199C18.2601 10.9782 18.2601 10.4242 17.9184 10.0825C17.5767 9.74074 17.0227 9.74074 16.681 10.0825L13.9994 12.7641L11.3179 10.0826C10.9762 9.74088 10.4222 9.74088 10.0805 10.0826C9.73879 10.4243 9.73879 10.9783 10.0805 11.32L12.762 14.0015L10.0813 16.6821Z" fill="#9AA0A6" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Shaxsiy maʼlumotlar siyosati matni shu yerda koʻrsatiladi (PDF yoki matn).</p>
          </div>
        </div>
      </nav>
    </>
  );
}
