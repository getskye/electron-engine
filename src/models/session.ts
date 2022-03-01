import { FromPartitionOptions, Session, session } from "electron";

export type EngineSessionOptions = FromPartitionOptions & {
  name: string;
  persist: true;
};

export class EngineSession {
  #session: Session;

  constructor(options: EngineSessionOptions) {
    this.#session = session.fromPartition(
      options.persist ? "persist:" + options.name : options.name,
      options
    );
  }

  get session() {
    return this.#session;
  }
}
