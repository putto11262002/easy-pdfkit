import type { TableMultiTypeTextFormatter } from "./type";

export class NumberFormatter implements TableMultiTypeTextFormatter<number> {
  constructor() {}

  public isSupported(value: number): boolean {
    return typeof value === "number";
  }

  // check if float if it is return value with 2 decimal places
  // else return value as integer
  public format(value: number): string {
    return value % 1 === 0 ? value.toString() : value.toFixed(2);
  }
}
