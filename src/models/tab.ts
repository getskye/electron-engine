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
  #browserView: BrowserView;
  #backgroundColor: string;

  constructor(options: EngineTabOptions) {
    this.#backgroundColor = options.backgroundColor;
    this.#browserView = new BrowserView(options);
    this.#browserView.setBackgroundColor(this.#backgroundColor);
    this.#browserView.setBounds(options.bounds);
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
