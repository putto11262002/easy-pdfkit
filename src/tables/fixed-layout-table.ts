import type { MultiTypeText, PDFDoc, TextOptions } from "../pdf-doc";
import { defaultCellPaddings } from "./defaults";

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

export type FixedLayoutTableCellValue =
  | MultiTypeText
  | ((doc: PDFDoc, args: { width: number; x: number; y: number }) => number);

export type FixedLayoutTableCellData = {
  value: FixedLayoutTableCellValue;
  textOpts?: TextOptions;
};

export type FixedLayoutTableData<
  T extends readonly FixedLayoutTableColumn<string>[],
> = Record<TableKeys<T>, FixedLayoutTableCellData>[];

export class FixedLayoutTable<
  T extends readonly FixedLayoutTableColumn<string>[],
> {
  private width: number;
  private header: boolean;

  public columns: T;
  private pdfDoc: PDFDoc;
  private columnsWidth: number[];
  private cellPaddings: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  private borders: boolean;

  constructor(pdfDoc: PDFDoc, tableOpts: FixedLayoutTableOpts<T>) {
    this.pdfDoc = pdfDoc;
    this.width = tableOpts.width || this.pdfDoc.getMarginAdjustedWidth();
    this.header =
      typeof tableOpts.header === "boolean" ? tableOpts.header : true;
    this.columns = tableOpts.columns;
    this.columnsWidth = this.getColumnWidths(tableOpts.columns);
    this.borders =
      typeof tableOpts.borders === "boolean" ? tableOpts.borders : true;
    this.cellPaddings =
      typeof tableOpts.cellPaddings !== "undefined"
        ? typeof tableOpts.cellPaddings === "number"
          ? {
              top: tableOpts.cellPaddings,
              right: tableOpts.cellPaddings,
              bottom: tableOpts.cellPaddings,
              left: tableOpts.cellPaddings,
            }
          : tableOpts.cellPaddings
        : defaultCellPaddings;
  }

  // Render method with correct key inference
  render(data: FixedLayoutTableData<T>) {
    if (this.header) {
      this.renderHeader();
    }
    data.forEach((row) => this.renderRow(Object.values(row)));
    this.pdfDoc.moveDown();
  }

  private renderHeader() {
    this.renderRow(
      this.columns.map((column) => ({ value: column.header || column.key })),
      { textOpts: { underline: true } },
    );
  }

  /**
   *
   * Render table row. Ater calling renderRow, the cursor is placed at the start of the next row.
   * It assumes that the cursor is at the start of the row.
   */
  private renderRow(
    cells: FixedLayoutTableCellData[],
    { textOpts }: { textOpts?: TextOptions } = {},
  ) {
    // determine row height by finding the tallest cell
    const beforeX = this.pdfDoc.x;
    const beforeY = this.pdfDoc.y;

    const heights = cells.map((cell, i) => {
      let height: number;

      const cellWidth =
        this.columnsWidth[i] -
        (this.cellPaddings.left + this.cellPaddings.right);
      const cellX = this.pdfDoc.x + this.cellPaddings.left;
      const cellY =
        beforeY + this.cellPaddings.top + this.pdfDoc.currentLineGap / 4;
      if (typeof cell.value === "function") {
        height = cell.value(this.pdfDoc, {
          width: cellWidth,
          x: cellX,
          y: cellY,
        });
      } else {
        height = this.pdfDoc.heightOfStringWithoutTailingLineGap(
          this.pdfDoc.formatMultiText(cell.value),
          {
            width: cellWidth,
          },
        );

        this.pdfDoc.multiTypeText(cell.value, cellX, cellY, {
          ...cell.textOpts,
          ...textOpts,
          width: cellWidth,
        });
      }

      this.pdfDoc.x += this.columnsWidth[i];
      return height;
    });
    const rowHeight =
      Math.max(...heights) + this.cellPaddings.top + this.cellPaddings.bottom;

    if (this.borders) {
      // grow row box
      this.pdfDoc.rect(beforeX, beforeY, this.width, rowHeight).stroke();
      // determine row height by finding the tallest cell
      this.pdfDoc.x = beforeX;
      this.pdfDoc.y = beforeY;

      // draw right cell border
      cells.forEach((_, i) => {
        if (i !== cells.length - 1) {
          this.pdfDoc
            .moveTo(this.pdfDoc.x + this.columnsWidth[i], this.pdfDoc.y)
            .lineTo(
              this.pdfDoc.x + this.columnsWidth[i],
              this.pdfDoc.y + rowHeight,
            )
            .stroke();
        }
      });
    }

    this.pdfDoc.x = beforeX;
    this.pdfDoc.y = beforeY + rowHeight;
  }

  private getColumnWidths(cols: T): number[] {
    const colSpans = new Array(this.columns.length).fill(1);

    cols.forEach((col, i) => {
      if (col.colSpan) {
        colSpans[i] = col.colSpan;
      }
    });

    const totalColSpan = colSpans.reduce((acc, cur) => acc + cur, 0);
    return colSpans.map((colSpan) => (colSpan / totalColSpan) * this.width);
  }
}
