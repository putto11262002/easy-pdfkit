import { FixedLayoutTableCellValue } from "easy-pdfkit";
import type { DefaultMultiType, PDFDoc, TextOptions } from "../pdf-doc";

export type TableKeys<T extends readonly FixedLayoutTableColumn<string>[]> =
  T[number]["key"]; // Extract union of all literal keys

export type FixedLayoutTableColumn<T extends string> = {
  header?: string;
  kalign?: "left" | "center" | "right";
  key: T; // T represents the literal type for the key
  colSpan?: number;
};

export type FixedLayoutTableOpts<
  T extends readonly FixedLayoutTableColumn<string>[],
> = {
  width?: number;
  x?: number;
  y?: number;
  cellPaddings?:
    | number
    | { top: number; right: number; bottom: number; left: number };
  header?: boolean;
  columns: T; // Require readonly array with literal string keys
  borders?: boolean;
};

type _FixedLayoutTableOpts<
  T extends readonly FixedLayoutTableColumn<string>[],
> = {
  width: number;
  x: number;
  y: number;
  cellPaddings: { top: number; right: number; bottom: number; left: number };
  header: boolean;
  columns: T;
  borders: boolean;
};

export const defaultFixedLayoutTableOpts = {
  cellPaddings: {
    top: 5,
    right: 5,
    bottom: 5,
    left: 5,
  },
  header: true,
  borders: true,
};

export type FixedLayoutTableCellData<CV, V extends CV | DefaultMultiType> = V;

export type FixedLayoutTableData<
  T extends readonly FixedLayoutTableColumn<string>[],
  CV,
  V extends CV | DefaultMultiType = CV | DefaultMultiType,
> = Record<TableKeys<T>, FixedLayoutTableCellData<CV, V>>[];

type Table<
  T extends readonly FixedLayoutTableColumn<string>[],
  CV,
  V extends CV | DefaultMultiType = CV | DefaultMultiType,
> = {
  opts: _FixedLayoutTableOpts<T>;
  doc: PDFDoc<CV>;
  data: FixedLayoutTableData<T, CV, V>;
  columnsY: number[];
  columnsWidth: number[];
  rowX: number;
  rowY: number;
};

export function renderFixedLayoutTable<
  T extends readonly FixedLayoutTableColumn<string>[],
  CV,
  V extends CV | DefaultMultiType = CV | DefaultMultiType,
>(
  doc: PDFDoc<CV>,
  _opts: FixedLayoutTableOpts<T>,
  data: FixedLayoutTableData<T, CV, V>,
) {
  const opts = mergeOptions(_opts, {
    ...defaultFixedLayoutTableOpts,
    width: doc.getMarginAdjustedWidth(),
    x: doc.x,
    y: doc.y,
  });

  const columnsWidth = getColumnWidths(opts.columns, opts.width);

  const table: Table<T, CV, V> = {
    opts,
    data,
    columnsY: getColumnsY(columnsWidth, opts.x),
    columnsWidth,
    doc,
    rowX: opts.x,
    rowY: opts.y,
  };

  if (opts.header) {
    renderRow<T, CV>({
      table,
      cells: table.opts.columns.map((column) => column.header || column.key),
    });
  }

  const sortedKeyData = sortObjectsByKeyOrder(
    data,
    opts.columns.map((col) => col.key),
  );

  sortedKeyData.forEach((row) => {
    renderRow({
      cells: Object.values(row),
      table,
    });
  });

  doc.moveDown();
}

function getColumnsY(columnWidth: number[], offset?: number) {
  const columnX: number[] = [];
  let offsetX: number = offset ?? 0;

  columnWidth.forEach((width) => {
    columnX.push(offsetX);
    offsetX += width;
  });

  return columnX;
}

function getRowHeight<
  T extends readonly FixedLayoutTableColumn<string>[],
  CV,
  V extends CV | DefaultMultiType,
>({
  tableOpts,
  cells,
  columnsWidth,
  x,
  formatText,
  heightOfString,
}: {
  cells: FixedLayoutTableCellData<CV, V>[];
  tableOpts: _FixedLayoutTableOpts<T>;
  columnsWidth: number[];
  x: number;
  heightOfString: (s: string, opts?: TextOptions) => number;
  formatText: (s: V) => string;
}) {
  // determine row height by finding the tallest cell
  const rowX: number = x;
  let offsetX: number = rowX;

  const heights = cells.map((cell, i) => {
    const contentWidth =
      columnsWidth[i] -
      (tableOpts.cellPaddings.left + tableOpts.cellPaddings.right);

    const formattedText = formatText(cell);
    const height = heightOfString(formattedText, {
      width: contentWidth,
    });

    offsetX += columnsWidth[i];
    return height;
  });

  const maxHeight =
    Math.max(...heights) +
    tableOpts.cellPaddings.top +
    tableOpts.cellPaddings.bottom;

  return maxHeight;
}

function heightOfStringClosur<CV, V extends CV | DefaultMultiType>(
  doc: PDFDoc<CV, V>,
) {
  return (s: string, opts?: TextOptions) =>
    doc.heightOfStringWithoutTailingLineGap(s, opts);
}

function formatTextCloser<CV, V extends CV | DefaultMultiType>(
  doc: PDFDoc<CV, V>,
) {
  return (v: FixedLayoutTableCellValue<CV, V>) => doc.formatText(v);
}

function renderRow<
  T extends readonly FixedLayoutTableColumn<string>[],
  CV,
  V extends CV | DefaultMultiType = CV | DefaultMultiType,
>({
  cells,
  table,
}: {
  cells: FixedLayoutTableCellValue<CV, V>[];
  table: Table<T, CV, V>;
}) {
  const rowHeight = getRowHeight({
    x: table.rowX,
    cells: cells,
    tableOpts: table.opts,
    heightOfString: heightOfStringClosur(table.doc),
    formatText: formatTextCloser(table.doc),
    columnsWidth: table.columnsWidth,
  });

  // check if row fits in the page
  if (rowHeight + table.rowY > table.doc.getMarginAdjustedHeight()) {
    table.doc.addPage();
    table.rowY = table.doc.y;
  }

  cells.map((value, i) => {
    const cellX = table.columnsY[i] + table.opts.cellPaddings.left;
    const cellY = table.rowY + table.opts.cellPaddings.top;
    const cellWidth =
      table.columnsWidth[i] -
      (table.opts.cellPaddings.left + table.opts.cellPaddings.right);
    table.doc.multiTypeText(table.doc.formatText(value), cellX, cellY, {
      width: cellWidth,
    });
  });

  // Render borders
  if (table.opts.borders) {
    table.doc
      .rect(table.rowX, table.rowY, table.opts.width, rowHeight)
      .stroke();

    for (let i = 1; i < cells.length; i++) {
      table.doc
        .moveTo(table.columnsY[i], table.rowY)
        .lineTo(table.columnsY[i], table.rowY + rowHeight)
        .stroke();
    }
  }

  // move rowY to the start of the next row

  table.rowY += rowHeight;
}

function getColumnWidths<T extends readonly FixedLayoutTableColumn<string>[]>(
  cols: T,
  tableWidth: number,
): number[] {
  const colSpans = new Array(cols.length).fill(1);

  cols.forEach((col, i) => {
    if (col.colSpan) {
      colSpans[i] = col.colSpan;
    }
  });

  const totalColSpan = colSpans.reduce((acc, cur) => acc + cur, 0);
  return colSpans.map((colSpan) => (colSpan / totalColSpan) * tableWidth);
}

function mergeOptions<T extends readonly FixedLayoutTableColumn<string>[]>(
  input: FixedLayoutTableOpts<T>,
  defaults: Omit<_FixedLayoutTableOpts<T>, "columns">,
): _FixedLayoutTableOpts<T> {
  return {
    ...defaults,
    ...input,
    cellPaddings:
      typeof input.cellPaddings === "number"
        ? {
            top: input.cellPaddings,
            right: input.cellPaddings,
            bottom: input.cellPaddings,
            left: input.cellPaddings,
          }
        : defaults.cellPaddings,
  };
}
function sortObjectsByKeyOrder(
  objects: Record<string, any>[],
  orderedKeys: string[],
): Record<string, any>[] {
  return objects.map((obj) => {
    const sortedObj: Record<string, any> = {};
    orderedKeys.forEach((key) => {
      if (obj.hasOwnProperty(key)) {
        sortedObj[key] = obj[key];
      }
    });
    return sortedObj;
  });
}
