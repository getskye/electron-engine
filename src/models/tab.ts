import {
  BrowserView,
  BrowserViewConstructorOptions,
  Rectangle,
} from "electron";

export interface EngineTabOptions extends BrowserViewConstructorOptions {
  backgroundColor: string;
  bounds: Rectangle;
}

export class EngineTab extends BrowserView {
  #backgroundColor: string;

  constructor(options: EngineTabOptions) {
    super(options);
    this.#backgroundColor = options.backgroundColor;
    this.setBackgroundColor(this.#backgroundColor);
    this.setBounds(options.bounds);
  }

  public set backgroundColor(color: string) {
    this.setBackgroundColor(color);
    this.#backgroundColor = color;
  }

  public set bounds(bounds: Rectangle) {
    this.setBounds(bounds);
  }

  public get bounds() {
    return this.getBounds();
  }
}
