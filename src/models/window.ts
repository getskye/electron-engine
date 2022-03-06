import { BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import { EventEmitter } from "tsee";
import { EngineTabManager } from "../managers/tabs";
import { EngineOverlay, EngineOverlayOptions } from "./overlay";

export type Offset = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type EngineWindowOptions = BrowserWindowConstructorOptions & {
  offset: Offset;
  ui: { file: string } | { url: string };
  waitForLoad: true;
};

export class EngineWindow extends EventEmitter<{
  offsetChanged: (offset: Offset) => void;
  overlayAdded: (overlay: EngineOverlay) => void;
  overlayRemoved: (overlay: EngineOverlay) => void;
  topOverlayChanged: (overlay: EngineOverlay) => void;
}> {
  #offset: Offset;
  #browserWindow: BrowserWindow;
  #tabManager: EngineTabManager;
  #overlays = new Set<EngineOverlay>();

  constructor(options: EngineWindowOptions) {
    super();
    this.#browserWindow = new BrowserWindow({ ...options, show: false });
    this.#offset = options.offset;
    this.#tabManager = new EngineTabManager({ window: this });

    if ("file" in options.ui) this.#browserWindow.loadFile(options.ui.file);
    else this.#browserWindow.loadURL(options.ui.url);

    if (options.waitForLoad)
      this.#browserWindow.once("ready-to-show", () => {
        this.#browserWindow.show();
      });
  }

  // NOTE: Stupid affine type hack FTW!
  close() {
    this.#tabManager.close();
    this.#browserWindow.close();
  }

  get tabManager() {
    return this.#tabManager;
  }

  get browserWindow() {
    return this.#browserWindow;
  }

  get offset() {
    return this.#offset;
  }

  set offset(offset: Offset) {
    this.#offset = offset;
  }

  get overlays() {
    return Array.from(this.#overlays.values());
  }

  getOverlay(id: string) {
    return this.overlays.find((tab) => tab.id === id);
  }

  setTopOverlay(overlay: EngineOverlay | string) {
    const resolvedOverlay =
      overlay instanceof EngineOverlay ? overlay : this.getOverlay(overlay);
    if (!resolvedOverlay) return;
    this.#browserWindow.setTopBrowserView(resolvedOverlay.browserView);
    this.emit("topOverlayChanged", resolvedOverlay);
  }

  deleteOverlay(overlay: EngineOverlay | string) {
    const resolvedOverlay =
      overlay instanceof EngineOverlay ? overlay : this.getOverlay(overlay);
    if (!resolvedOverlay) return;

    resolvedOverlay.destroy();
    this.#browserWindow.removeBrowserView(resolvedOverlay.browserView);
    this.#overlays.delete(resolvedOverlay);

    this.emit("overlayRemoved", resolvedOverlay);
  }

  createOverlay(
    options: EngineOverlayOptions & {
      top: boolean;
      ui: { file: string } | { url: string };
    }
  ) {
    const overlay = new EngineOverlay({
      ...options,
    });

    if ("file" in options.ui)
      overlay.browserView.webContents.loadFile(options.ui.file);
    else overlay.browserView.webContents.loadURL(options.ui.url);

    this.#browserWindow.addBrowserView(overlay.browserView);

    this.emit("overlayAdded", overlay);
    if (options.top) this.setTopOverlay(overlay);

    return overlay;
  }
}
