import { FromPartitionOptions, Session, session } from "electron";

export type EngineSessionOptions = FromPartitionOptions & {
  id: string;
  persist: boolean;
  storageProvider: StorageProvider;
};

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

export interface StorageProvider {
  get<T extends JSONValue>(key: string): Promise<T | undefined>;
  set<T extends JSONValue>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

export class EngineSession {
  #session: Session;
  #id: string;
  #persist: boolean;
  #cache: boolean;
  #storage: StorageProvider;

  constructor(options: EngineSessionOptions) {
    this.#session = session.fromPartition(
      options.persist ? "persist:" + options.id : options.id,
      options
    );
    this.#id = options.id;
    this.#persist = options.persist;
    this.#cache = options.cache;
    this.#storage = options.storageProvider;
  }

  get session() {
    return this.#session;
  }

  get id() {
    return this.#id;
  }

  get persist() {
    return this.#persist;
  }

  get cache() {
    return this.#cache;
  }

  get storage() {
    return this.#storage;
  }
}
