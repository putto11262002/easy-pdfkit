import PDFKitFont from "pdfkit/js/mixins/fonts";
import pdfDoc, { options, text } from "pdfkit";
import {
  FixedLayoutTableColumn,
  FixedLayoutTableData,
  FixedLayoutTableOpts,
  renderFixedLayoutTable,
} from "./tables";

export type TextOptions = Exclude<Parameters<typeof text>[1], undefined>;

export type VOptions = TextOptions & {
  fontSize?: number;
  font?: typeof PDFKitFont;
};

export type TextSizes = "normal" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export type TextSizesMap = Record<
  TextSizes,
  {
    size: number;
  }
>;

export type MultiTypeTextFormatter<T> = (value: T) => string | null;

export type PDFDocOptions<
  CV extends Exclude<unknown, Function> = DefaultMultiType,
> = Omit<typeof options, ""> & {
  size?: [number, number] | keyof typeof SIZES;
  textSizes?: TextSizesMap;
  header?: string | { text: string; marginTop: number; marginBottom: number };
  // formatter?: MultiTypeTextFormatter<CV>;
};

type Options = Omit<typeof options, "margins" | "size"> & {
  textSizes?: TextSizesMap;
  size: [number, number];
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
};

const SIZES = {
  "4A0": [4767.87, 6740.79],
  "2A0": [3370.39, 4767.87],
  A0: [2383.94, 3370.39],
  A1: [1683.78, 2383.94],
  A2: [1190.55, 1683.78],
  A3: [841.89, 1190.55],
  A4: [595.28, 841.89],
  A5: [419.53, 595.28],
  A6: [297.64, 419.53],
  A7: [209.76, 297.64],
  A8: [147.4, 209.76],
  A9: [104.88, 147.4],
  A10: [73.7, 104.88],
  B0: [2834.65, 4008.19],
  B1: [2004.09, 2834.65],
  B2: [1417.32, 2004.09],
  B3: [1000.63, 1417.32],
  B4: [708.66, 1000.63],
  B5: [498.9, 708.66],
  B6: [354.33, 498.9],
  B7: [249.45, 354.33],
  B8: [175.75, 249.45],
  B9: [124.72, 175.75],
  B10: [87.87, 124.72],
  C0: [2599.37, 3676.54],
  C1: [1836.85, 2599.37],
  C2: [1298.27, 1836.85],
  C3: [918.43, 1298.27],
  C4: [649.13, 918.43],
  C5: [459.21, 649.13],
  C6: [323.15, 459.21],
  C7: [229.61, 323.15],
  C8: [161.57, 229.61],
  C9: [113.39, 161.57],
  C10: [79.37, 113.39],
  RA0: [2437.8, 3458.27],
  RA1: [1729.13, 2437.8],
  RA2: [1218.9, 1729.13],
  RA3: [864.57, 1218.9],
  RA4: [609.45, 864.57],
  SRA0: [2551.18, 3628.35],
  SRA1: [1814.17, 2551.18],
  SRA2: [1275.59, 1814.17],
  SRA3: [907.09, 1275.59],
  SRA4: [637.8, 907.09],
  EXECUTIVE: [521.86, 756.0],
  FOLIO: [612.0, 936.0],
  LEGAL: [612.0, 1008.0],
  LETTER: [612.0, 792.0],
  TABLOID: [792.0, 1224.0],
} as const;

export const DEFAULT_TEXT_SIZES: TextSizesMap = {
  normal: { size: 12 },
  h1: { size: 24 },
  h2: { size: 22 },
  h3: { size: 20 },
  h4: { size: 18 },
  h5: { size: 16 },
  h6: { size: 14 },
};

const DEFAULT_MARGINS = {
  top: 50,
  bottom: 50,
  left: 72,
  right: 72,
};

const DEFAULT_COLOR_PALETTE = {
  primary: "#000000",
  secondary: "#808080",
};

const DEFAULT_LINE_GAP = 2;

export type DefaultMultiType =
  | string
  | number
  | boolean
  | Date
  | undefined
  | null;

function defaultMultiTypeTextFormatter(value: DefaultMultiType): string | null {
  if (value === undefined || value === null) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === "number") return value.toString();
  if (typeof value === "string") return value;
  return null;
}

export class PDFDoc<
  CV = DefaultMultiType,
  V extends CV | DefaultMultiType = CV | DefaultMultiType,
> extends pdfDoc {
  options: Options;
  currentLineGap: number = DEFAULT_LINE_GAP;
  currentFontSize: number = DEFAULT_TEXT_SIZES.normal.size;
  textSizes: TextSizesMap;
  private formatter?: MultiTypeTextFormatter<CV>;
  private defaultFormatters: MultiTypeTextFormatter<DefaultMultiType> =
    defaultMultiTypeTextFormatter;
  private header:
    | { text: string; marginTop: number; marginBottom: number }
    | undefined;

  constructor(options?: PDFDocOptions<CV>) {
    super({ ...options, autoFirstPage: false });
    this.options = {
      ...options,
      size:
        typeof options?.size !== "undefined"
          ? Array.isArray(options.size)
            ? (options.size as [number, number])
            : (SIZES[options.size] as [number, number])
          : (SIZES.A4 as [number, number]),
      margins: options?.margin
        ? {
            top: options.margin,
            bottom: options.margin,
            left: options.margin,
            right: options.margin,
          }
        : options?.margins || DEFAULT_MARGINS,
    };

    this.lineGap(this.currentLineGap);
    this.fontSize(this.currentFontSize);

    this.textSizes = options?.textSizes || DEFAULT_TEXT_SIZES;
    // this.formatter = options?.formatter;

    this.header =
      typeof options?.header === "string"
        ? {
            text: options.header,
            marginTop: this.options.margins.top / 2,
            marginBottom: this.options.margins.top / 2,
          }
        : options?.header;

    // adjust margin top to include header
    if (this.header) {
      const headerHeight = this.heightOfStringWithoutTailingLineGap(
        this.header.text,
      );
      if (this.header.marginTop)
        this.options.margins.top =
          headerHeight + this.header.marginTop + this.header.marginBottom;
    }
    this.registerListeners();
    this.addPage();
  }

  registerListeners() {
    // add header if exists when add page
    this.on("pageAdded", () => {
      this.renderHeader();
    });
  }

  private renderHeader() {
    if (this.header) {
      this.fillColor(DEFAULT_COLOR_PALETTE.secondary);
      this.x = this.options.margins.left;
      this.y = this.header.marginTop;
      this.text(this.header.text);
      this.y = this.options.margins.top;
      this.fillColor(DEFAULT_COLOR_PALETTE.primary);
    }
  }

  formatText(text: V): string {
    let output: string | null = null;
    if (this.formatter) {
      output = this.formatter(text as unknown as CV);
    }
    if (output === null) {
      output = this.defaultFormatters(text as DefaultMultiType);
    }
    if (output === null) {
      throw new Error(`Cannot format text: ${text}`);
    }
    return output;
  }

  multiTypeText(text: V, opts?: VOptions): this;
  multiTypeText(text: V, x?: number, y?: number, opts?: VOptions): this;

  multiTypeText(
    text: V,
    xOrOpts?: number | VOptions,
    y?: number,
    opts?: VOptions,
  ) {
    const formattedText = this.formatText(text);
    if (typeof xOrOpts === "number") {
      this.text(formattedText, xOrOpts, y, opts);
    } else {
      this.text(formattedText, xOrOpts);
    }
    return this;
  }

  lineGap(lineGap: number): this {
    super.lineGap(lineGap);
    this.currentLineGap = lineGap;
    return this;
  }

  private _setFontSizeAndText(
    text: V,
    xOrOpts: number | TextOptions | undefined,
    y: number | undefined,
    opts: TextOptions | undefined,
    fontSize: number,
  ): this {
    const prevFontSize = this.currentFontSize;
    this.fontSize(fontSize);
    if (typeof xOrOpts === "number") {
      this.multiTypeText(text, xOrOpts, y, opts);
    } else {
      this.multiTypeText(text, xOrOpts);
    }
    this.fontSize(prevFontSize);
    return this;
  }

  h1(text: V, opts?: TextOptions): this;
  h1(text: V, x?: number, y?: number, opts?: TextOptions): this;
  h1(text: V, xOrOpts?: number | TextOptions, y?: number, opts?: TextOptions) {
    return this._setFontSizeAndText(
      text,
      xOrOpts,
      y,
      opts,
      this.textSizes.h1.size,
    );
  }

  h2(text: V, opts?: TextOptions): this;
  h2(text: V, x?: number, y?: number, opts?: TextOptions): this;
  h2(text: V, xOrOpts?: number | TextOptions, y?: number, opts?: TextOptions) {
    return this._setFontSizeAndText(
      text,
      xOrOpts,
      y,
      opts,
      this.textSizes.h2.size,
    );
  }

  h3(text: V, opts?: TextOptions): this;
  h3(text: V, x?: number, y?: number, opts?: TextOptions): this;

  h3(text: V, xOrOpts?: number | TextOptions, y?: number, opts?: TextOptions) {
    return this._setFontSizeAndText(
      text,
      xOrOpts,
      y,
      opts,
      this.textSizes.h3.size,
    );
  }

  h4(text: V, opts?: TextOptions): this;
  h4(text: V, x?: number, y?: number, opts?: TextOptions): this;

  h4(text: V, xOrOpts?: number | TextOptions, y?: number, opts?: TextOptions) {
    return this._setFontSizeAndText(
      text,
      xOrOpts,
      y,
      opts,
      this.textSizes.h4.size,
    );
  }

  h5(text: V, opts?: TextOptions): this;
  h5(text: V, x?: number, y?: number, opts?: TextOptions): this;

  h5(text: V, xOrOpts?: number | TextOptions, y?: number, opts?: TextOptions) {
    return this._setFontSizeAndText(
      text,
      xOrOpts,
      y,
      opts,
      this.textSizes.h5.size,
    );
  }

  h6(text: V, opts?: TextOptions): this;
  h6(text: V, x?: number, y?: number, opts?: TextOptions): this;

  h6(text: V, xOrOpts?: number | TextOptions, y?: number, opts?: TextOptions) {
    return this._setFontSizeAndText(
      text,
      xOrOpts,
      y,
      opts,
      this.textSizes.h6.size,
    );
  }

  normal(text: V, opts?: TextOptions): this;
  normal(text: V, x?: number, y?: number, opts?: TextOptions): this;

  normal(
    text: V,
    xOrOpts?: number | TextOptions,
    y?: number,
    opts?: TextOptions,
  ) {
    return this._setFontSizeAndText(
      text,
      xOrOpts,
      y,
      opts,
      this.textSizes.normal.size,
    );
  }

  fontSize(size: number): this {
    super.fontSize(size);
    this.currentFontSize = size;
    return this;
  }

  getMarginAdjustedZeroX() {
    return this.options.margins.left;
  }

  getMarginAddedZeroY() {
    return this.options.margins.top;
  }

  getMarginAdjustedWidth() {
    return (
      (this.page?.width ?? this.options.size[0]) -
      this.options.margins.left -
      this.options.margins.right
    );
  }

  getMarginAdjustedHeight() {
    return (
      (this.page?.height ?? this.options.size[1]) -
      this.options.margins.top -
      this.options.margins.bottom
    );
  }

  heightOfStringWithoutTailingLineGap(text: string, opts?: TextOptions) {
    return (
      this.heightOfString(text, {
        width: this.getMarginAdjustedWidth(),
        ...opts,
      }) - this.currentLineGap
    );
  }

  fixedLayoputTable<T extends readonly FixedLayoutTableColumn<string>[]>(
    opts: FixedLayoutTableOpts<T>,
    data: FixedLayoutTableData<T, CV>,
  ) {
    renderFixedLayoutTable<T, CV>(this, opts, data);
  }
}
