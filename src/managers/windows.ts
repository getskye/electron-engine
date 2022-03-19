import { BrowserWindow, app, WebContents } from "electron";
import { EventEmitter } from "tsee";
import { EngineWindow, EngineWindowOptions } from "../models/window";

export class EngineWindowManager extends EventEmitter<{
  windowAdded: (window: EngineWindow) => void;
  windowRemoved: (window: EngineWindow) => void;
  windowFocused: (window: EngineWindow) => void;
}> {
  #windows = new Set<EngineWindow>([]);
  #focusHandler: () => void;

  private handleWindowFocus = (
    _: Electron.Event,
    window: Electron.BrowserWindow
  ) => {
    const engineWindow = this.windows.find((w) => w.browserWindow === window);

    if (engineWindow) this.emit("windowAdded", engineWindow);
  };

  constructor() {
    super();
    this.#focusHandler = () => this.handleWindowFocus;
    app.on("browser-window-focus", this.#focusHandler);
  }

  close() {
    app.off("browser-window-focus", this.#focusHandler);
    this.#windows.forEach((w) => {
      w.close();
    });
  }

  createWindow(options: EngineWindowOptions) {
    const window = new EngineWindow(options);
    this.#windows.add(window);

    window.browserWindow.on("closed", () => {
      this.#windows.delete(window);
      this.emit("windowRemoved", window);
    });

    this.emit("windowAdded", window);

    return window;
  }

  destroyWindow(window: EngineWindow) {
    if (!this.#windows.has(window)) throw new Error("Window not managed");
    this.#windows.delete(window);

    window.close();

    this.emit("windowRemoved", window);
  }

  fromWebContents(contents: WebContents) {
    return this.windows.find(
      (w) => w.browserWindow.id === BrowserWindow.fromWebContents(contents)?.id
    );
  }

  getWindow(id: number) {
    return this.windows.find((w) => w.browserWindow.id === id);
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
