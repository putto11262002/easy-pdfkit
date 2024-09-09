import type { MultiTypeText } from "../pdf-doc";

export interface TableMultiTypeTextFormatter<T extends any> {
  isSupported: (value: T) => boolean;
  format: (value: T) => string;
}
 