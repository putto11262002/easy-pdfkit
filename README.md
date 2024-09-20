# Easy-PDFKit

This project offers a lightweight wrapper around [PDFKit](https://pdfkit.org/), designed to simplify the process of creating PDFs while preserving the underlying library's flexibility. The API provides intuitive methods for generating common PDF elements like tables and headings (h1, h2, etc.), along with the ability to define custom formatters for data types beyond simple strings.

## Installation

```bash
pnpm install easy-pdfkit
```

## Usage

```typescript
import { PDFDoc } from "easy-pdfkit";
import fs from "fs";

const doc = new PDFDoc({
  header: "Example Doc", // Add header to every page
});

doc.pipe(fs.createWriteStream("example.output.pdf"));

// Add headings of different levels
doc.heading("Heading", "h1");
doc.heading("Sub Heading", "h2");

// Add table
doc.table(
  {
    columns: [
      { key: "name", header: "Name" },
      { key: "email", header: "Email" },
      { key: "dateOfBirth", header: "Date Of Birth" },
    ] as const,
  },
  [
    {
      name: "John Doe",
      email: "john.doe@example.com",
      dateOfBirth: new Date("1990-05-10"),
    },
    {
      name: "Jane Smith",
      email: "jane.smith@example.com",
      dateOfBirth: new Date("1985-09-15"),
    },
  ],
);

// Using built-in formatter to add non-string data
doc.multiTypeText(new Date()); // -> 9/20/2024
doc.multiTypeText(true); // -> Yes

doc.end();
```

## Tables

This section demonstrates how to create tables using Easy-PDFKit. Currently, the library supports only fixed-layout tables. Support for auto-layout tables is still under development.

Tables can be created using the table method, which accepts a TableConfig object and an array of data objects. The data objects must match the structure defined in the columns property of the TableConfig.

If the table content exceeds the available space on the current page, Easy-PDFKit will automatically insert a page break and continue the table on the next page.

```typescript
const doc = new EasyPDFKit();

doc.table(
  {
    // Required: An array of objects that matches the shape define in the columns property
    columns: [
      { header: "Name", key: "name" },
      { header: "Age", key: "age" },
    ],
  },
  [
    { name: "John Doe", age: 30 },
    { name: "Jane Doe", age: 25 },
  ],
);
```

### Type definition for `TableConfig`:

```typescript
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
```

## Headings

Headings can be added to the document using the `heading` method, which accepts the heading text, heading level, and an optional `TextOptions` object. Currently supported heading levels are `h1`, `h2`, `h3`, `h4`, `h5`, and `h6`.

```typescript
const doc = new PDFDoc();

doc.heading("heading", "h1", { underline: true });
doc.heading("sub heading", "h2");
doc.heading("sub sub heading", "h3");
```

The size and `TextOptions` for each heading level can be globally customized via the `headingConfig` option in the `PDFDoc` constructor.

```typescript
const doc = new PDFDoc({
  headingConfig: {
    h1: { size: 24 }, // Override h1 heading size
    h2: { size: 22, textOptions: { underline: true } }, // Override h2 size and text options
  },
});
```

In future releases, custom heading levels will be supported.

## Formatters

Easy-PDFKit includes a built-in formatter that supports the following types: `string`, `number`, `date`, `boolean`, `null`, and `undefined`. You can also define custom formatters for other data types or override the default formatters by implementing the `MultiTypeTextFormatter` interface and passing it to the `formatter` property in the `PDFDoc` constructor.

```typescript
const doc = new PDFDoc({});

doc.multiTypeText(false); // -> No
doc.multiTypeText(123); // -> 123
doc.multiTypeText(new Date()); // -> 9/20/2024 (formatted date)
```

### Default Formatter Implementation

The default formatter is implemented as follows:

```typescript
function defaultMultiTypeTextFormatter(value: DefaultMultiType): string | null {
  if (value === undefined || value === null) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === "number") return value.toString();
  if (typeof value === "string") return value;
  return null;
}
```

### Creating Custom Formatters

When writing a custom formatter, although you define the argument type for the formatter function, the value is **not type-checked at runtime**. It's up to the developer to ensure the value passed to the formatter matches the expected type. If the value cannot be formatted, the formatter should return `null` to signal that the default formatter should be used as a fallback.

#### Example: Custom Formatter for a Single Type

Here's an example of a custom formatter for a `Point` type, which represents a 2D point.

```typescript
class Point {
  constructor(
    public x: number,
    public y: number,
  ) {}
}

// Implement custom formatter for the Point class
const customFormatter: MultiTypeTextFormatter<Point> = (value) => {
  if (value instanceof Point) {
    return `(${value.x}, ${value.y})`;
  }
  // Return null if the value cannot be formatted
  return null;
};

const doc = new PDFDoc({
  formatter: customFormatter,
});

doc.multiTypeText(new Point(0, 0)); // -> (0, 0)
doc.multiTypeText(new Point(1, 1)); // -> (1, 1)
```

#### Example: Custom Formatter for Multiple Types

Here's an example of a custom formatter that supports both `Passenger` and `Flight` types.

```typescript
class Flight {
  constructor(
    public flightNum: string,
    public origin: string,
    public destination: string,
  ) {}
}

class Passenger {
  constructor(
    public name: string,
    public seatNum: string,
    public flight: Flight,
  ) {}
}

// Implement custom formatter for Passenger and Flight classes
const customFormatter: MultiTypeTextFormatter<Passenger | Flight> = (value) => {
  if (value instanceof Passenger) {
    return `${value.name} seated at ${value.seatNum} on flight ${value.flight.flightNum}`;
  }
  if (value instanceof Flight) {
    return `Flight ${value.flightNum} from ${value.origin} to ${value.destination}`;
  }
  // Return null if the value cannot be formatted
  return null;
};

const doc = new PDFDoc({
  formatter: customFormatter,
});

const flight = new Flight("BA123", "LHR", "JFK");
const passenger = new Passenger("John Doe", "1A", flight);

doc.multiTypeText(flight); // -> Flight BA123 from LHR to JFK
doc.multiTypeText(passenger); // -> John Doe seated at 1A on flight BA123
```

## PDFKit

PDFKit is a versatile JavaScript library for generating PDFs. It offers a high-level API for creating documents with various elements like text, images, shapes, and more. For more information and examples, please visit the [official PDFKit documentation](https://pdfkit.org)

## Contributing

Contributions are welcome! To contribute:

- Fork the repo.
- Create a feature branch (git checkout -b feature-name).
- Commit your changes (git commit -m 'Add feature').
- Push to your branch and open a pull request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
