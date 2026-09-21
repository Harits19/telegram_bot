export const logger = console;

export class Logger {
  prefix: string;
  constructor(prefix: string | object | Function) {
    if (typeof prefix === "function") {
      this.prefix = prefix.name;
    } else if (typeof prefix === "string") {
      this.prefix = prefix;
    } else {
      this.prefix = prefix.constructor.name;
    }
  }

  nested(prefix: string | object | Function) {
    let name = "";
    if (typeof prefix === "function") {
      name = prefix.name;
    } else if (typeof prefix === "object") {
      name = prefix.constructor.name;
    } else {
      name = prefix;
    }
    return new Logger(`${[this.prefix, name].join(".")}`);
  }

  debug(message: string) {
    console.debug(`${this.prefix} ${message}`);
  }

  info(message: string) {
    console.info(`${this.prefix} ${message}`);
  }

  error(message: string) {
    console.error(`${this.prefix} ${message}`);
  }

  warn(message: string) {
    console.warn(`${this.prefix} ${message}`);
  }
}
