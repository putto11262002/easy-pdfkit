import type { TableMultiTypeTextFormatter } from "./type";

export class BooleanFormatter implements TableMultiTypeTextFormatter<boolean> {
  constructor() {}
  isSupported(value: boolean) {
    return typeof value === "boolean";
  }
  format(value: boolean) {
    return value ? "Yes" : "No";
  }
}
