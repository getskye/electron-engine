import { randomUUID } from "crypto";
import {
  BrowserView,
  BrowserViewConstructorOptions,
  Rectangle,
} from "electron";
import { EventEmitter } from "tsee";
import { EngineTabManager } from "../managers/tabs";

export interface EngineTabOptions extends BrowserViewConstructorOptions {
  backgroundColor: string;
  tabManager: EngineTabManager;
}

export class EngineTab extends EventEmitter<{
  titleChanged: (title: string | undefined) => void;
  themeColorChange: (color: string | undefined) => void;
  finishLoad: () => void;
  loadStart: () => void;
  loadStop: () => void;
  navigationStateChanged: (state: {
    canNavigateBackward: boolean;
    canNavigateForward: boolean;
  }) => void;
}> {
  #id: string = randomUUID();
  #title?: string;
  #color?: string;
  #url: string = "about:empty";
  #loading: boolean = true;
  #browserView: BrowserView;
  #backgroundColor: string;
  #finishLoadHandler: () => void;
  #pageTitleUpdatedHandler: (event: Electron.Event, title: string) => void;
  #didChangeThemeColorHandler: (
    event: Electron.Event,
    color: string | null
  ) => void;
  #loadStartHandler: () => void;
  #loadStopHandler: () => void;
  #navigationStartHandler: () => void;

  constructor(options: EngineTabOptions) {
    super();
    this.#backgroundColor = options.backgroundColor;
    this.#browserView = new BrowserView({
      ...options,
      webPreferences: {
        ...options.webPreferences,
        session: options.tabManager.window.session.session,
      },
    });
    this.#browserView.setBackgroundColor(this.#backgroundColor);
    this.#browserView.setAutoResize({
      width: true,
      height: true,
      horizontal: false,
      vertical: false,
    });

    this.#browserView.webContents.once("did-finish-load", () =>
      this.#browserView.setBounds(
        options.tabManager.calculateBounds(options.tabManager.window.offset)
      )
    );

    this.#finishLoadHandler = () => {
      this.#title = this.browserView.webContents.getTitle();
      this.emit("titleChanged", this.#title);
      this.emit("finishLoad");
    };

    this.#pageTitleUpdatedHandler = (_, title) => {
      this.#title = title;
      this.emit("titleChanged", title);
    };

    this.#didChangeThemeColorHandler = (_, color) => {
      this.#color = color ?? undefined;
      this.emit("themeColorChange", color ?? undefined);
    };

    this.#loadStartHandler = () => {
      this.#loading = true;
      this.updateNavigationState();
      this.emit("loadStart");
    };

    this.#loadStopHandler = () => {
      this.#loading = false;
      this.updateNavigationState();

      this.emit("loadStop");
    };

    this.#navigationStartHandler = () => {
      this.updateNavigationState();
    };

    this.#browserView.webContents.on(
      "did-finish-load",
      this.#finishLoadHandler
    );
    this.#browserView.webContents.on(
      "page-title-updated",
      this.#pageTitleUpdatedHandler
    );
    this.#browserView.webContents.on(
      "did-change-theme-color",
      this.#didChangeThemeColorHandler
    );
    this.#browserView.webContents.on(
      "did-start-loading",
      this.#loadStartHandler
    );
    this.#browserView.webContents.on("did-stop-loading", this.#loadStopHandler);

    this.#browserView.webContents.on(
      "did-start-navigation",
      this.#navigationStartHandler
    );

    // this.#browserView.webContents.on("page-favicon-updated", (_, favicons) => {
    //   // TODO: handle favicons
    // });
  }

  public destroy() {
    this.#browserView.webContents.off(
      "did-finish-load",
      this.#finishLoadHandler
    );
    this.#browserView.webContents.off(
      "page-title-updated",
      this.#pageTitleUpdatedHandler
    );
    this.#browserView.webContents.off(
      "did-change-theme-color",
      this.#didChangeThemeColorHandler
    );
    this.#browserView.webContents.off(
      "did-start-loading",
      this.#loadStartHandler
    );
    this.#browserView.webContents.off(
      "did-stop-loading",
      this.#loadStopHandler
    );
    this.#browserView.webContents.off(
      "did-start-navigation",
      this.#navigationStartHandler
    );
  }

  public get id() {
    return this.#id;
  }

  public get title() {
    return this.#title;
  }

  public get color() {
    return this.#color;
  }

  public get url() {
    return this.#url;
  }

  public get loading() {
    return this.#loading;
  }

  public set url(url: string) {
    this.#url = url;
    this.#browserView.webContents.loadURL(url);
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

  reload() {
    this.#browserView.webContents.reload();
  }

  cancelNavigation() {
    this.#browserView.webContents.stop();
  }

  private updateNavigationState() {
    this.emit("navigationStateChanged", {
      canNavigateBackward: this.canNavigateBackward,
      canNavigateForward: this.canNavigateForward,
    });
  }

  public get canNavigateBackward() {
    return this.#browserView.webContents.canGoBack();
  }

  public get canNavigateForward() {
    return this.#browserView.webContents.canGoForward();
  }

  public navigateBackward() {
    return this.#browserView.webContents.goBack();
  }

  public navigateForward() {
    return this.#browserView.webContents.goForward();
  }
}
