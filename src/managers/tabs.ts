// import { BrowserView, Rectangle } from "electron";
import { Rectangle } from "electron";
import { EventEmitter } from "tsee";
import { EngineTab, EngineTabOptions } from "../models/tab";
import { EngineWindow } from "../models/window";

export interface EngineTabManagerOptions {
  //   backgroundColor: string;
  //   bounds: Rectangle;
  window: EngineWindow;
}

export class EngineTabManager extends EventEmitter<{
  tabAdded: (tab: EngineTab, index: number) => void;
  tabRemoved: (tab: EngineTab, index: number) => void;
  activeTabChanged: (tab: EngineTab, index: number) => void;
}> {
  #tabs: EngineTab[] = [];
  #window: EngineWindow;

  constructor(options: EngineTabManagerOptions) {
    super();

    this.#window = options.window;
  }

  hasTab(tab: number | EngineTab) {
    return !!(typeof tab === "number"
      ? this.#tabs[tab]
      : this.#tabs.find((t) => tab.webContents.id === t.webContents.id));
  }

  getTabFromIndex(index: number) {
    return this.#tabs[index];
  }

  get length() {
    return this.#tabs.length;
  }

  setActiveTab(tab: number | EngineTab) {
    if (!this.hasTab(tab)) throw new Error("Tab not in tab manager");
    const newActiveTab =
      typeof tab === "number" ? this.getTabFromIndex(tab) : tab;

    if (!newActiveTab) throw new Error("Tab not in tab manager");

    this.#window.setBrowserView(newActiveTab);
    newActiveTab.webContents.focus();

    this.emit(
      "activeTabChanged",
      newActiveTab,
      typeof tab === "number" ? tab : this.#tabs.indexOf(tab)
    );
  }

  get activeTab() {
    const activeView = this.#window.getBrowserView();
    if (!activeView) return;

    return this.#tabs.find(
      (t) => activeView.webContents.id === t.webContents.id
    );
  }

  createTab(
    options: Omit<EngineTabOptions, "bounds">,
    at?: number,
    active: boolean = false
  ) {
    const offset = this.#window.offset;
    const bounds = this.#window.getBounds();
    const tab = new EngineTab({
      ...options,
      bounds: {
        x: offset.left,
        y: offset.top,
        width: bounds.width - offset.right,
        height: bounds.height - offset.bottom,
      },
    });

    if (at) {
      this.#tabs.splice(at, 0, tab);
    } else {
      this.#tabs.push(tab);
    }

    const index = at || this.#tabs.length - 1;
    this.emit("tabAdded", tab, index);
    if (active) this.setActiveTab(index);

    return index;
  }

  removeTab(tab: number | EngineTab) {
    if (!this.hasTab(tab)) throw new Error("Tab not in tab manager");

    const index = typeof tab === "number" ? tab : this.#tabs.indexOf(tab);
    const resolvedTab = typeof tab === "number" ? this.#tabs[tab] : tab;
    this.#tabs.splice(index, 0);

    this.emit("tabRemoved", resolvedTab, index);

    if (this.activeTab === resolvedTab) {
      const nextActiveTab = this.#tabs[index - 1] || this.#tabs[index + 1];
      if (!nextActiveTab) {
        this.#window.removeBrowserView(resolvedTab);
        // TODO: This is awkward... we don't have another tab
        // Maybe tell the window to kill itsself
      }

      this.setActiveTab(nextActiveTab);
    }

    // TODO: I don't see a way to manually destroy the webcontents, maybe it's destroyed on GC?
  }
}
