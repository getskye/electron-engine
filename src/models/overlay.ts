import { randomUUID } from "crypto";
import {
  BrowserView,
  BrowserViewConstructorOptions,
  Rectangle,
} from "electron";
import { EventEmitter } from "tsee";

export interface EngineOverlayOptions extends BrowserViewConstructorOptions {
  backgroundColor: string;
  bounds: Rectangle;
  resize: Electron.AutoResizeOptions;
}
export class EngineOverlay extends EventEmitter<{}> {
  #id: string = randomUUID();
  #browserView: BrowserView;
  #backgroundColor: string;

  constructor(options: EngineOverlayOptions) {
    super();
    this.#backgroundColor = options.backgroundColor;
    this.#browserView = new BrowserView(options);
    this.#browserView.setBackgroundColor(this.#backgroundColor);
    this.#browserView.setAutoResize(options.resize);

    this.#browserView.webContents.once("did-finish-load", () =>
      this.#browserView.setBounds(options.bounds)
    );
  }

  public destroy() {}

  public get id() {
    return this.#id;
  }

  public set backgroundColor(color: string) {
    this.#browserView.setBackgroundColor(color);
    this.#backgroundColor = color;
  }

  public set bounds(bounds: Rectangle) {
    this.#browserView.setBounds(bounds);
  }

  public get bounds() {
    return this.#browserView.getBounds();
  }

  public get browserView() {
    return this.#browserView;
  }
}
