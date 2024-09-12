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

export type CellRenderers<CV, V = CV | DefaultMultiType> = (
  doc: PDFDoc<CV>,
  args: { width: number; x: number; y: number },
) => number;

export type FixedLayoutTableCellValue<CV, V = CV | DefaultMultiType> =
  | V
  | CellRenderers<V>;

export type FixedLayoutTableCellData<CV, V = CV | DefaultMultiType> =
  | {
      value: FixedLayoutTableCellValue<V>;
      textOpts?: TextOptions;
    }
  | FixedLayoutTableCellValue<V>;

export type FixedLayoutTableData<
  T extends readonly FixedLayoutTableColumn<string>[],
  CV,
  V = CV | DefaultMultiType,
> = Record<TableKeys<T>, FixedLayoutTableCellData<CV>>[];

export function renderFixedLayoutTable<
  T extends readonly FixedLayoutTableColumn<string>[],
  CV,
  V = CV | DefaultMultiType,
>(
  doc: PDFDoc<CV>,
  _opts: FixedLayoutTableOpts<T>,
  data: FixedLayoutTableData<T, V>,
) {
  const opts = mergeOptions(_opts, {
    ...defaultFixedLayoutTableOpts,
    width: doc.getMarginAdjustedWidth(),
    x: doc.x,
    y: doc.y,
  });
  const columnsWidths = getColumnWidths(opts.columns, opts.width);

  let rowY = opts.y;
  let rowX = opts.x;

  if (opts.header) {
    const updatedPos = renderRow<T, CV>({
      cells: opts.columns.map((col) => col.header || col.key),
      textOpts: { underline: true },
      x: rowX,
      y: rowY,
      doc,
      tableOpts: opts,
      columnsWidth: columnsWidths,
    });
    rowY = updatedPos.y;
    rowX = updatedPos.x;
  }

  const sortedKeyData = sortObjectsByKeyOrder(
    data,
    opts.columns.map((col) => col.key),
  );
  sortedKeyData.forEach((row) => {
    const updatedPos = renderRow({
      cells: Object.values(row),
      x: rowX,
      y: rowY,
      doc,
      tableOpts: opts,
      columnsWidth: columnsWidths,
    });
    rowY = updatedPos.y;
    rowX = updatedPos.x;
  });

  // Move cursor to one line below the table
  doc.y = rowY;
  doc.x = opts.x;
  doc.moveDown();
}

function renderRow<
  T extends readonly FixedLayoutTableColumn<string>[],
  CV,
  V = CV | DefaultMultiType,
>({
  tableOpts,
  cells,
  doc,
  textOpts,
  columnsWidth,
  x,
  y,
}: {
  cells: FixedLayoutTableCellData<V>[];
  doc: PDFDoc<CV>;
  tableOpts: _FixedLayoutTableOpts<T>;
  columnsWidth: number[];
  x: number;
  y: number;
  textOpts?: TextOptions;
}): { x: number; y: number } {
  // determine row height by finding the tallest cell
  const rowX: number = x;
  const rowY: number = y;
  let offsetX: number = rowX;
  let cellX: number;
  let cellY: number = rowY + tableOpts.cellPaddings.top;

  const heights = cells.map((cell, i) => {
    let height: number;

    const cellWidth =
      columnsWidth[i] -
      (tableOpts.cellPaddings.left + tableOpts.cellPaddings.right);
    cellX = offsetX + tableOpts.cellPaddings.left;

    let cellValue: FixedLayoutTableCellValue<V>;
    let cellTextOpts: TextOptions | undefined;

    if (typeof cell === "object" && cell !== null && "value" in cell) {
      cellValue = cell.value;
      textOpts = cell.textOpts;
    } else {
      cellValue = cell;
    }

    try {
      const formattedText = doc.formatText(cellValue as unknown as CV);
      height = doc.heightOfStringWithoutTailingLineGap(formattedText, {
        width: cellWidth,
      });

      doc.multiTypeText(formattedText, cellX, cellY, {
        ...textOpts,
        ...cellTextOpts,
        width: cellWidth,
      });
    } catch (c) {
      if (typeof cellValue === "function") {
        // Move the cursor to the left top cornor of the cell
        doc.y = cellY;
        doc.x = cellX;
        height = (cellValue as CellRenderers<CV>)(doc, {
          width: cellWidth,
          x: cellX,
          y: cellY,
        });
      } else {
        throw new Error("Invalid cell renderer function provided.");
      }
    }

    offsetX += columnsWidth[i];
    return height;
  });

  const rowHeight =
    Math.max(...heights) +
    tableOpts.cellPaddings.top +
    tableOpts.cellPaddings.bottom;

  if (tableOpts.borders) {
    // Draw row borders
    doc.rect(rowX, rowY, tableOpts.width, rowHeight).stroke();

    offsetX = rowX;
    // Draw right cell border
    cells.forEach((_, i) => {
      if (i !== cells.length - 1) {
        doc
          .moveTo(offsetX + columnsWidth[i], rowY)
          .lineTo(offsetX + columnsWidth[i], rowY + rowHeight)
          .stroke();
        offsetX += columnsWidth[i];
      }
    });
  }

  doc.y = rowY + rowHeight;
  doc.x = rowX;
  return { x: doc.x, y: doc.y };
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
