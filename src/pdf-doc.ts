import PDFKitFont from "pdfkit/js/mixins/fonts";
import pdfDoc, { options, text } from "pdfkit";
import { getMultiTypeValue } from "./formatters/factory";
import { TableMultiTypeTextFormatter } from "./formatters/type";
import defaultFormatters from "./formatters/deafults";

export type TextOptions = Exclude<Parameters<typeof text>[1], undefined>;

export type MultiTypeTextOptions = TextOptions & {
  fontSize?: number;
  font?: typeof PDFKitFont;
};

type TextSizes = "normal" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type TextSizesMap = Record<
  TextSizes,
  {
    size: number;
  }
>;

const defaultTextSizes: TextSizesMap = {
  normal: { size: 12 },
  h1: { size: 24 },
  h2: { size: 22 },
  h3: { size: 20 },
  h4: { size: 18 },
  h5: { size: 16 },
  h6: { size: 14 },
};

export type PDFDocOptions = Omit<typeof options, "margins"> & {
  size: [number, number];
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  textSizes?: TextSizesMap;
  header?: string | { text: string; marginTop: number; marginBottom: number };
  formatters?: TableMultiTypeTextFormatter<any>[]
};

type Options = Omit<typeof options, "margins"> & {
  size: [number, number];
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  textSizes?: TextSizesMap;
  header?: string | { text: string; marginTop: number; marginBottom: number };

};



const defaultMargins = {
  top: 50,
  bottom: 50,
  left: 72,
  right: 72,
};

const defaultColors = {
  primary: "#000000",
  secondary: "#808080",
};

export type MultiTypeText = any

export class PDFDoc extends pdfDoc {
  options: Options;
  currentLineGap: number = 4;
  currentFontSize: number = defaultTextSizes.normal.size;
  textSizes: TextSizesMap;
  private formatters: TableMultiTypeTextFormatter<any>[];
  private header:
    | { text: string; marginTop: number; marginBottom: number }
    | undefined;
  constructor(options: PDFDocOptions) {
    super({ ...options, autoFirstPage: false });
    this.options = {
      ...options,
      margins: options.margins || defaultMargins,
    };
    this.formatters = [...(options.formatters || []), ...defaultFormatters]
    this.lineGap(this.currentLineGap);
    this.fontSize(this.currentFontSize);
    this.textSizes = options.textSizes || defaultTextSizes;
    this.header =
      typeof options.header === "string"
        ? {
            text: options.header,
            marginTop: this.options.margins.top / 2,
            marginBottom: this.options.margins.top / 2,
          }
        : options.header;
    // adjust margin top to include header
    if (this.header) {
      const headerHeight = this.heightOfStringWithoutTailingLineGap(
        this.header.text,
      );
      this.options.margins.top =
        headerHeight + this.header.marginTop + this.header.marginBottom;
    }
    this.registerListeners();
    this.addPage();
  }

  registerListeners() {
    // add header if exists when add page
    this.on("pageAdded", () => {
      if (this.header) {
        this.fillColor(defaultColors.secondary);
        this.x = this.options.margins.left;
        this.y = this.header.marginTop;
        this.normal(this.header.text);
        this.y = this.options.margins.top;
        this.fillColor(defaultColors.primary);
      }
    });
  }

  multiTypeText(text: MultiTypeText, opts?: MultiTypeTextOptions): this;
  multiTypeText(
    text: MultiTypeText,
    x?: number,
    y?: number,
    opts?: MultiTypeTextOptions,
  ): this;

  multiTypeText(
    text: MultiTypeText,
    xOrOpts?: number | MultiTypeTextOptions,
    y?: number,
    opts?: MultiTypeTextOptions,
  ) {
    const formattedText = this.formatMultiText(text);
    if (typeof xOrOpts === "number") {
      this.text(formattedText, xOrOpts, y, opts);
    } else {
      this.text(formattedText, xOrOpts);
    }
    return this;
  }

  formatMultiText(text: MultiTypeText): string {
    return getMultiTypeValue(text).format(text);
  }

  lineGap(lineGap: number): this {
    super.lineGap(lineGap);
    this.currentLineGap = lineGap;
    return this;
  }

  private _setFontSizeAndText(
    text: string,
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

  h1(text: string, opts?: TextOptions): this;
  h1(text: string, x?: number, y?: number, opts?: TextOptions): this;
  h1(
    text: string,
    xOrOpts?: number | TextOptions,
    y?: number,
    opts?: TextOptions,
  ) {
    return this._setFontSizeAndText(
      text,
      xOrOpts,
      y,
      opts,
      this.textSizes.h1.size,
    );
  }

  h2(text: string, opts?: TextOptions): this;
  h2(text: string, x?: number, y?: number, opts?: TextOptions): this;
  h2(
    text: string,
    xOrOpts?: number | TextOptions,
    y?: number,
    opts?: TextOptions,
  ) {
    return this._setFontSizeAndText(
      text,
      xOrOpts,
      y,
      opts,
      this.textSizes.h2.size,
    );
  }

  h3(text: string, opts?: TextOptions): this;
  h3(text: string, x?: number, y?: number, opts?: TextOptions): this;

  h3(
    text: string,
    xOrOpts?: number | TextOptions,
    y?: number,
    opts?: TextOptions,
  ) {
    return this._setFontSizeAndText(
      text,
      xOrOpts,
      y,
      opts,
      this.textSizes.h3.size,
    );
  }

  h4(text: string, opts?: TextOptions): this;
  h4(text: string, x?: number, y?: number, opts?: TextOptions): this;

  h4(
    text: string,
    xOrOpts?: number | TextOptions,
    y?: number,
    opts?: TextOptions,
  ) {
    return this._setFontSizeAndText(
      text,
      xOrOpts,
      y,
      opts,
      this.textSizes.h4.size,
    );
  }

  h5(text: string, opts?: TextOptions): this;
  h5(text: string, x?: number, y?: number, opts?: TextOptions): this;

  h5(
    text: string,
    xOrOpts?: number | TextOptions,
    y?: number,
    opts?: TextOptions,
  ) {
    return this._setFontSizeAndText(
      text,
      xOrOpts,
      y,
      opts,
      this.textSizes.h5.size,
    );
  }

  h6(text: string, opts?: TextOptions): this;
  h6(text: string, x?: number, y?: number, opts?: TextOptions): this;

  h6(
    text: string,
    xOrOpts?: number | TextOptions,
    y?: number,
    opts?: TextOptions,
  ) {
    return this._setFontSizeAndText(
      text,
      xOrOpts,
      y,
      opts,
      this.textSizes.h6.size,
    );
  }

  normal(text: string, opts?: TextOptions): this;
  normal(text: string, x?: number, y?: number, opts?: TextOptions): this;

  normal(
    text: string,
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
      this.options.size[0] -
      this.options.margins.left -
      this.options.margins.right
    );
  }

  getMarginAdjustedHeight() {
    return (
      this.options.size[1] -
      this.options.margins.top -
      this.options.margins.bottom
    );
  }

  getFormatter(value: any) {
  const formatter = this.formatters.find((f) => f.isSupported(value));
  if (!formatter) {
    throw new Error(`No formatter found for ${value}`);
  }
  return formatter;
}

  heightOfStringWithoutTailingLineGap(text: string, opts?: TextOptions) {
    return (
      this.heightOfString(text, {
        width: this.getMarginAdjustedWidth(),
        ...opts,
      }) - this.currentLineGap
    );
  }
}
