import type { TableMultiTypeTextFormatter } from "./type";

export class UndefinedOrNullFormatter
  implements TableMultiTypeTextFormatter<undefined | null>
{
  constructor() {}
  isSupported(value: undefined | null) {
    return value === undefined || value === null;
  }
  format(_: undefined | null) {
    return "-";
  }
}
