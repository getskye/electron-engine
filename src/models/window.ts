import { BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import { EventEmitter } from "tsee";
import { EngineTabManager } from "../managers/tabs";

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
}> {
  #offset: Offset;
  #browserWindow: BrowserWindow;
  #tabManager: EngineTabManager;

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
  close(): asserts this is never {
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
}
