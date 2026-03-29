import { toast } from 'sonner';

type ConfirmDialogOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
};

export const confirmDialog = ({
  title,
  description,
  confirmText = 'Ya',
  cancelText = 'Batal',
  variant = 'default',
}: ConfirmDialogOptions): Promise<boolean> =>
  new Promise((resolve) => {
    let settled = false;
    let toastId: string | number | undefined;

    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
      if (toastId != null) toast.dismiss(toastId);
    };

    toastId = toast.custom(
      () => (
        <div className="w-[360px] rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          {description ? <div className="mt-1 text-xs text-gray-600">{description}</div> : null}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => finish(false)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => finish(true)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${
                variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        onDismiss: () => finish(false),
      }
    );
  });

