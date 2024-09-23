import pdfkit from "pdfkit";
import {
  DEFAULT_COLOR_PALETTE,
  DEFAULT_LINE_GAP,
  DEFAULT_MARGINS,
  DEFAULT_HEADING_COFIG,
  SIZES,
} from "./constant";
import { renderTable, TableColumn, TableConfig, TableData } from "./tables";

export type TextOptions = Exclude<Parameters<typeof pdfkit.text>[1], undefined>;

export type TextSizes = "normal" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export type DefaultHeading = "normal" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

// Generic type that allows dynamic keys and ensures the values match the required structure
export type _HeadingConfig<T extends string> = Readonly<
  Record<
    T,
    {
      size: number;
      textOptions?: TextOptions; // Adjust TextOptions based on your actual use case
    }
  >
>;

export type HeadingConfig<T extends string> = Readonly<
  Record<
    T,
    {
      size?: number;
      textOptions?: TextOptions; // Adjust TextOptions based on your actual use case
    }
  >
>;

export type MultiTypeTextFormatter<T> = (value: T) => string | null;

export type PDFDocOptions<V> = Omit<typeof pdfkit.options, ""> & {
  size?: [number, number] | keyof typeof SIZES;
  headingConfig?: Partial<HeadingConfig<DefaultHeading>>;
  header?: string | { text: string; marginTop: number; marginBottom: number };

  formatter?: MultiTypeTextFormatter<V>;
};

type Options = Omit<typeof pdfkit.options, "margins" | "size"> & {
  headingConfig: _HeadingConfig<DefaultHeading>;
  size: [number, number];
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
};

export type MultiTypeValue<V> = V | DefaultMultiType;

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

export class PDFDoc<V = DefaultMultiType> extends pdfkit {
  options: Options;
  currentLineGap!: number;
  currentFontSize!: number;
  private formatter?: MultiTypeTextFormatter<V>;
  private defaultFormatters: MultiTypeTextFormatter<DefaultMultiType> =
    defaultMultiTypeTextFormatter;
  private header:
    | { text: string; marginTop: number; marginBottom: number }
    | undefined;

  constructor(options?: PDFDocOptions<V>) {
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
      headingConfig: Object.entries(DEFAULT_HEADING_COFIG).reduce(
        (acc, [key, value]) => {
          acc[key] = {
            ...value,
            ...options?.headingConfig?.[key as DefaultHeading],
          };
          return acc;
        },
        {} as any,
      ),
    };

    this.lineGap(DEFAULT_LINE_GAP);
    this.fontSize(this.options.headingConfig.normal.size);

    this.formatter = options?.formatter;

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

  formatText(text: MultiTypeValue<V>): string {
    let output: string | null = null;
    if (this.formatter) {
      output = this.formatter(text as unknown as V);
    }
    if (output === null) {
      output = this.defaultFormatters(text as DefaultMultiType);
    }
    if (output === null) {
      throw new Error(`Cannot format text: ${text}`);
    }
    return output;
  }

  multiTypeText(text: MultiTypeValue<V>, opts?: TextOptions): this;
  multiTypeText(
    text: MultiTypeValue<V>,
    x?: number,
    y?: number,
    opts?: TextOptions,
  ): this;

  multiTypeText(
    text: MultiTypeValue<V>,
    xOrOpts?: number | TextOptions,
    y?: number,
    opts?: TextOptions,
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
    text: MultiTypeValue<V>,
    fontSize: number,
    opts?: TextOptions,
  ): this;
  private _setFontSizeAndText(
    text: MultiTypeValue<V>,
    fontSize: number,
    x?: number,
    y?: number,
    opts?: TextOptions,
  ): this;

  private _setFontSizeAndText(
    text: MultiTypeValue<V>,
    fontSize: number,
    xOrOpts?: number | TextOptions | undefined,
    y?: number | undefined,
    opts?: TextOptions | undefined,
  ): this {
    const prevFontSize = this.currentFontSize;
    this.fontSize(fontSize);
    if (typeof xOrOpts === "number") {
      this.multiTypeText(text, xOrOpts, y, opts);
    } else {
      console.log("opts in setFontSizeAndText", xOrOpts);
      this.multiTypeText(text, xOrOpts);
    }
    this.fontSize(prevFontSize);
    return this;
  }

  heading(
    text: MultiTypeValue<V>,
    level: DefaultHeading,
    opts?: TextOptions,
  ): this;
  heading(
    text: MultiTypeValue<V>,
    level: DefaultHeading,
    x?: number,
    y?: number,
    opts?: TextOptions,
  ): this;
  heading(
    text: MultiTypeValue<V>,
    level: DefaultHeading,
    xOrOpts?: number | TextOptions,
    y?: number,
    opts?: TextOptions,
  ) {
    const headingConfig = this.options.headingConfig;
    const config = headingConfig[level];
    if (!config) {
      throw new Error(`Heading ${level} not found in config`);
    }
    if (typeof xOrOpts === "number") {
      this._setFontSizeAndText(text, config.size, xOrOpts, y, {
        ...config.textOptions,
        ...opts,
      });
    } else {
      console.log("in heading", {
        opts: xOrOpts,
        config: config.textOptions,
        combined: { ...config.textOptions, ...xOrOpts },
      });
      this._setFontSizeAndText(text, config.size, {
        ...config.textOptions,
        ...xOrOpts,
      });
    }
    return this;
  }

  fontSize(size: number): this {
    super.fontSize(size);
    this.currentFontSize = size;
    return this;
  }

  getMarginAdjustedZeroX() {
    return this.options.margins.left;
  }

  getMarginAdjustedZeroY() {
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
      (this.options.margins.top + this.options.margins.bottom)
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

  table<T extends readonly TableColumn<string>[]>(
    config: TableConfig<T>,
    data: TableData<T, V>,
  ) {
    renderTable<T, V>({ doc: this, config, data });
  }
}
