import { EventEmitter } from "tsee";
import { EngineTab, EngineTabOptions } from "../models/tab";
import { EngineWindow, Offset } from "../models/window";

export interface EngineTabManagerOptions {
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
    this.#window.on("offsetChanged", this.handleChangeOffset);
  }

  private calculateBounds(offset: Offset) {
    const bounds = this.#window.browserWindow.getBounds();

    return {
      x: offset.left,
      y: offset.top,
      width: bounds.width - offset.right,
      height: bounds.height - offset.bottom,
    };
  }

  private handleChangeOffset(offset: Offset) {
    const bounds = this.calculateBounds(offset);
    this.#tabs.forEach((t) => t.browserView.setBounds(bounds));
  }

  // NOTE: Stupid affine type hack FTW!
  close() {
    this.#window.off("offsetChanged", this.handleChangeOffset);
  }

  hasTab(tab: number | EngineTab) {
    return !!(typeof tab === "number"
      ? this.#tabs[tab]
      : this.#tabs.find(
          (t) => tab.browserView.webContents.id === t.browserView.webContents.id
        ));
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

    this.#window.browserWindow.setBrowserView(newActiveTab.browserView);
    newActiveTab.browserView.webContents.focus();

    this.emit(
      "activeTabChanged",
      newActiveTab,
      typeof tab === "number" ? tab : this.#tabs.indexOf(tab)
    );
  }

  get activeTab() {
    const activeView = this.#window.browserWindow.getBrowserView();
    if (!activeView) return;

    return this.#tabs.find(
      (t) => activeView.webContents.id === t.browserView.webContents.id
    );
  }

  createTab(
    options: Omit<EngineTabOptions, "bounds">,
    at?: number,
    active: boolean = false
  ) {
    const offset = this.#window.offset;
    const bounds = this.calculateBounds(offset);
    const tab = new EngineTab({
      ...options,
      bounds,
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
        this.#window.browserWindow.removeBrowserView(resolvedTab.browserView);
        this.#window.close();
      }

      this.setActiveTab(nextActiveTab);
    }

    // NOTE: I don't see a way to manually destroy the webcontents, maybe it's destroyed on GC?
  }
}

// const owo: EngineTabManager = new EngineTabManager({ window: 1 as any });
