import type { DefaultMultiType, MultiTypeValue, PDFDoc } from "../pdf-doc";
import { DEFAULT_TABLE_STATIC_CONFIG } from "./default";
import { renderFixedLayoutTable } from "./fixed-layout-table";

export type TableKeys<T extends readonly TableColumn<string>[]> =
  T[number]["key"]; // Extract union of all literal keys

/**
 * Configuration for a table column.
 *
 * @template T - A string type representing the key that will be used to extract values from the data object.
 */
export type TableColumn<T extends string> = {
  /**
   * The header text to be displayed for the column. If not provided, the column will have no header text.
   *
   * @optional
   */
  header?: string;

  /**
   * Specifies the alignment of text within the column. Can be left-aligned, center-aligned, or right-aligned.
   *
   * @default "left"
   */
  align?: "left" | "center" | "right";

  /**
   * A unique key used to extract the value from the data object for this column.
   * This key must match a property in the data object associated with this column.
   */
  key: T;

  /**
   * Specifies how many columns this column should span. Only applicable when the table layout is set to "fixed".
   * If not provided, the column will span 1 column by default.
   *
   * @example
   * // Column spans 2 columns
   * colSpan: 2
   *
   * @default 1
   * @optional
   */
  colSpan?: number;
};

/**
 * Configuration settings for rendering a table.
 *
 * @template T - An array of `TableColumn` objects defining the columns of the table.
 */
export type TableConfig<T extends readonly TableColumn<string>[]> = {
  /**
   * The width of the table in units. If not provided, the table will span the full width of the page.
   *
   * @optional
   */
  width?: number;

  /**
   * The X coordinate (horizontal position) of the table. Defaults to the left margin if not provided.
   *
   * @optional
   */
  x?: number;

  /**
   * The Y coordinate (vertical position) of the table. Defaults to the current Y coordinate if not provided.
   *
   * @optional
   */
  y?: number;

  /**
   * Padding for each cell in the table. Can be a single number to apply equal padding to all sides,
   * or an object specifying individual padding values for top, right, bottom, and left.
   *
   * @example
   * // Equal padding for all sides:
   * cellPaddings: 5
   *
   * // Custom padding for each side:
   * cellPaddings: { top: 5, right: 10, bottom: 5, left: 10 }
   *
   * @optional
   */
  cellPaddings?:
    | number
    | { top: number; right: number; bottom: number; left: number };

  /**
   * Whether to render the header row of the table.
   *
   * @default true
   * @optional
   */
  header?: boolean;

  /**
   * An array defining the configuration for each column in the table.
   */
  columns: T;

  /**
   * Whether to render borders around the table and its cells.
   *
   * @default false
   * @optional
   */
  borders?: boolean;

  /**
   * The layout mode of the table, determining how the width of each column is calculated. The default is `"fixed"`.
   *
   * - `"fixed"`: The table's width is fixed, and each column has a fixed width determined by the following:
   *   - If a `colSpan` property is provided for a column, its width will be calculated as:
   *     (colSpan / totalColSpan) * tableWidth, where `totalColSpan` is the sum of all `colSpan` values in the `columns` array.
   *   - If no `colSpan` is provided, the width will be evenly divided as: (1 / totalColumns) * tableWidth.
   *
   * - `"auto"`: (Not yet implemented)
   *
   * @default "fixed"
   * @optional
   */
  layout?: "auto" | "fixed";
};

export type _TableConfig<T extends readonly TableColumn<string>[]> = {
  width: number;
  x: number;
  y: number;
  cellPaddings: { top: number; right: number; bottom: number; left: number };
  header: boolean;
  columns: T;
  borders: boolean;
  layout: "auto" | "fixed";
};

export type TableCellValue<V> = MultiTypeValue<V>;

export type TableData<T extends readonly TableColumn<string>[], V> = Record<
  TableKeys<T>,
  TableCellValue<V>
>[];

export function renderTable<T extends readonly TableColumn<string>[], V>({
  doc,
  config: _config,
  data,
}: {
  doc: PDFDoc<V>;
  config: TableConfig<T>;
  data: TableData<T, V>;
}): void {
  const config = mergeOptions(_config, {
    ...DEFAULT_TABLE_STATIC_CONFIG,
    width: doc.getMarginAdjustedWidth(),
    x: doc.getMarginAdjustedZeroX(),
    y: doc.y,
  });

  renderFixedLayoutTable({ doc, config: config, data });
}

function mergeOptions<T extends readonly TableColumn<string>[]>(
  input: TableConfig<T>,
  defaults: Omit<_TableConfig<T>, "columns">,
): _TableConfig<T> {
  return {
    ...defaults,
    ...input,
    cellPaddings: input.cellPaddings
      ? typeof input.cellPaddings === "number"
        ? {
            top: input.cellPaddings,
            right: input.cellPaddings,
            bottom: input.cellPaddings,
            left: input.cellPaddings,
          }
        : input.cellPaddings
      : defaults.cellPaddings,
  };
}
