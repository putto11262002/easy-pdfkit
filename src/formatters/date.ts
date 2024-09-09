import type { TableMultiTypeTextFormatter } from "./type";

export class DateFormatter implements TableMultiTypeTextFormatter<Date> {
  constructor() {}

  public isSupported(value: Date): boolean {
    return value instanceof Date;
  }

  public format(value: Date): string {
    return value.toDateString();
  }
}
