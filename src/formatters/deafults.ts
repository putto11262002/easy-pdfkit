import { BooleanFormatter } from "./boolean";
import { DateFormatter } from "./date";
import { NumberFormatter } from "./number";
import { StringFormatter } from "./string";
import { TableMultiTypeTextFormatter } from "./type";
import { UndefinedOrNullFormatter } from "./undefined-null";

const defaultFormatters: TableMultiTypeTextFormatter<any>[] = [
    new StringFormatter(),
    new NumberFormatter(),
    new DateFormatter(),
    new BooleanFormatter(),
    new UndefinedOrNullFormatter(),
  ];

  export default defaultFormatters
   