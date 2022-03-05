import { randomUUID } from "crypto";
import {
  BrowserView,
  BrowserViewConstructorOptions,
  Rectangle,
} from "electron";

export interface EngineTabOptions extends BrowserViewConstructorOptions {
  backgroundColor: string;
  bounds: Rectangle;
}

export class EngineTab {
  #id = randomUUID();
  #browserView: BrowserView;
  #backgroundColor: string;

  constructor(options: EngineTabOptions) {
    this.#backgroundColor = options.backgroundColor;
    this.#browserView = new BrowserView(options);
    this.#browserView.setBackgroundColor(this.#backgroundColor);
    this.#browserView.setAutoResize({
      width: true,
      height: true,
      horizontal: false,
      vertical: false,
    });
    this.#browserView.webContents.on("did-finish-load", () =>
      this.#browserView.setBounds(options.bounds)
    );
  }

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
