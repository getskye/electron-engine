import { BrowserWindow, BrowserWindowConstructorOptions } from "electron";

export interface Offset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}
export interface EngineWindowOptions extends BrowserWindowConstructorOptions {
  offset: Offset;
}

export class EngineWindow extends BrowserWindow {
  #offset: Offset;

  constructor(options: EngineWindowOptions) {
    super(options);
    this.#offset = options.offset;
  }

  get offset() {
    return this.#offset;
  }
}
