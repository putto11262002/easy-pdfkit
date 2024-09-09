import type { MultiTypeText } from "../pdf-doc";
import { BooleanFormatter } from "./boolean";
import { DateFormatter } from "./date";
import { NumberFormatter } from "./number";
import { StringFormatter } from "./string";
import type { TableMultiTypeTextFormatter } from "./type";
import { UndefinedOrNullFormatter } from "./undefined-null";

const formatters: TableMultiTypeTextFormatter<any>[] = [
  new StringFormatter(),
  new NumberFormatter(),
  new DateFormatter(),
  new BooleanFormatter(),
  new UndefinedOrNullFormatter(),
];
export function getMultiTypeValue(
  value: MultiTypeText,
): TableMultiTypeTextFormatter<any> {
  const formatter = formatters.find((f) => f.isSupported(value));
  if (!formatter) {
    throw new Error(`No formatter found for ${value}`);
  }
  return formatter;
}
