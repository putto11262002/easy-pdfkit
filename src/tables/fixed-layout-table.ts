import { _TableConfig, TableCellValue, TableColumn, TableData } from "./table";
import type { DefaultMultiType, PDFDoc, TextOptions } from "../pdf-doc";
import { sortObjectsByKeyOrder } from "./utils";

type Table<
  T extends readonly TableColumn<string>[],
  CV,
  V extends CV | DefaultMultiType = CV | DefaultMultiType,
> = {
  opts: _TableConfig<T>;
  doc: PDFDoc<CV>;
  data: TableData<T, CV, V>;
  columnsY: number[];
  columnsWidth: number[];
  rowX: number;
  rowY: number;
};

export function renderFixedLayoutTable<
  T extends readonly TableColumn<string>[],
  CV,
>({
  doc,
  config,
  data,
}: {
  doc: PDFDoc<CV>;
  config: _TableConfig<T>;
  data: TableData<T, CV>;
}) {
  const columnsWidth = getColumnWidths(config.columns, config.width);

  const table: Table<T, CV> = {
    opts: config,
    data,
    columnsY: getColumnsY(columnsWidth, config.x),
    columnsWidth,
    doc,
    rowX: config.x,
    rowY: config.y,
  };

  if (config.header) {
    renderRow<T, CV>({
      table,
      cells: table.opts.columns.map((column) => column.header || column.key),
    });
  }

  const sortedKeyData = sortObjectsByKeyOrder(
    data,
    config.columns.map((col) => col.key),
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
  T extends readonly TableColumn<string>[],
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
  cells: TableCellValue<CV, V>[];
  tableOpts: _TableConfig<T>;
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
  return (v: TableCellValue<CV, V>) => doc.formatText(v);
}

function renderRow<
  T extends readonly TableColumn<string>[],
  CV,
  V extends CV | DefaultMultiType = CV | DefaultMultiType,
>({
  cells,
  table,
}: {
  cells: TableCellValue<CV, V>[];
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

function getColumnWidths<T extends readonly TableColumn<string>[]>(
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
