import { overlay } from "overlay-kit";
import { ConfirmModal } from "~/components/ConfirmModal";

interface ConfirmOptions {
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
}

type ConfirmHandlers = {
  onConfirm: (fn: () => void) => ConfirmHandlers;
  onCancel: (fn: () => void) => ConfirmHandlers;
};

export function confirm(options: ConfirmOptions): ConfirmHandlers {
  let confirmHandler = () => {};
  let cancelHandler = () => {};

  overlay.open((props) => (
    <ConfirmModal
      {...props}
      {...options}
      onConfirm={() => {
        confirmHandler();
        props.close();
      }}
      onCancel={() => {
        cancelHandler();
        props.close();
      }}
    />
  ));

  const handlers: ConfirmHandlers = {
    onConfirm(fn) {
      confirmHandler = fn;
      return handlers;
    },
    onCancel(fn) {
      cancelHandler = fn;
      return handlers;
    },
  };

  return handlers;
}
