import { BrowserWindow, app } from "electron";
import { EventEmitter } from "tsee";
import { EngineWindow, EngineWindowOptions } from "../models/window";

export class EngineWindowManager extends EventEmitter<{
  windowAdded: (window: EngineWindow) => void;
  windowRemoved: (window: EngineWindow) => void;
  windowFocused: (window: EngineWindow) => void;
}> {
  #windows = new Set<EngineWindow>([]);
  #windowCloseHandler:
    | null
    | ((e: Electron.Event, window: EngineWindow) => void) = null;
  #windowCloseHandlerMap: Record<string, (event: Electron.Event) => void> = {};

  private handleWindowFocus = (
    _: Electron.Event,
    window: Electron.BrowserWindow
  ) => {
    const engineWindow = this.windows.find((w) => w.browserWindow === window);

    if (engineWindow) this.emit("windowAdded", engineWindow);
  };

  constructor() {
    super();
    app.on("browser-window-focus", this.handleWindowFocus);
  }

  close() {
    app.off("browser-window-focus", this.handleWindowFocus);
    this.#windows.forEach((w) => {
      delete this.#windowCloseHandlerMap[w.browserWindow.id];
      w.close();
    });
  }

  createWindow(options: EngineWindowOptions) {
    const window = new EngineWindow(options);
    this.#windows.add(window);

    const handler = (event: Electron.Event) => {
      if (this.#windowCloseHandler) this.#windowCloseHandler(event, window);
      if (!event.defaultPrevented) this.destroyWindow(window);
    };
    this.#windowCloseHandlerMap[window.browserWindow.id] = handler;

    window.browserWindow.on("close", handler);

    this.emit("windowAdded", window);

    return window;
  }

  destroyWindow(window: EngineWindow) {
    if (!this.#windows.has(window)) throw new Error("Window not managed");
    this.#windows.delete(window);
    delete this.#windowCloseHandlerMap[window.browserWindow.id];

    window.close();

    this.emit("windowRemoved", window);
  }

  setWindowCloseHandler(
    handler: ((e: Electron.Event, window: EngineWindow) => void) | null
  ) {
    this.#windowCloseHandler = handler;
  }

  get windows() {
    return [...this.#windows.values()];
  }

  get amount() {
    return this.#windows.size;
  }

  get focused() {
    return this.windows.find(
      (w) => w.browserWindow === BrowserWindow.getFocusedWindow()
    );
  }
}
