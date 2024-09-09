import type { TableMultiTypeTextFormatter } from "./type";

export class StringFormatter implements TableMultiTypeTextFormatter<string> {
  constructor() {}
  public isSupported(value: string): boolean {
    return typeof value === "string";
  }

  public format(value: string): string {
    return value;
  }
}
