type IdleCallbackHandle = number;
type IdleCallbackOptions = { timeout?: number };

type IdleTask = () => void | Promise<void>;

interface IdleDeadline {
  readonly didTimeout: boolean;
  timeRemaining: () => number;
}

type IdleCallback = (deadline: IdleDeadline) => void;

type IdleCallbackWindow = Window & {
  requestIdleCallback?: (
    callback: IdleCallback,
    options?: IdleCallbackOptions,
  ) => IdleCallbackHandle;
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
};

type ScheduleIdleOptions = {
  timeout?: number;
  delay?: number;
};

/**
 * 지정한 task를 idle 시점으로 미루고, 취소 함수를 반환한다.
 * requestIdleCallback이 없을 경우 setTimeout으로 대체한다.
 */
export function scheduleIdle(task: IdleTask, options: ScheduleIdleOptions = {}) {
  const { timeout = 1000, delay = 200 } = options;

  if (typeof window === "undefined") {
    task();
    return () => {};
  }

  const idleWindow = window as IdleCallbackWindow;
  const hasIdleCallback =
    typeof idleWindow.requestIdleCallback === "function" &&
    typeof idleWindow.cancelIdleCallback === "function";

  if (hasIdleCallback) {
    const handle = idleWindow.requestIdleCallback(
      () => {
        task();
      },
      { timeout },
    );
    return () => {
      idleWindow.cancelIdleCallback?.(handle);
    };
  }

  const timeoutId = window.setTimeout(() => {
    task();
  }, delay);

  return () => {
    window.clearTimeout(timeoutId);
  };
}
