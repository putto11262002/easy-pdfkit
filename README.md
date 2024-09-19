# Easy-PDFKit

This project offers a lightweight wrapper around [PDFKit](https://pdfkit.org/), designed to simplify the process of creating PDFs while preserving the underlying library's flexibility. The API provides intuitive methods for generating common PDF elements like tables and headings (h1, h2, etc.), along with the ability to define custom formatters for data types beyond simple strings.

## Installation

```bash
pnpm install easy-pdfkit
```

## Usage

```typescript
import { EasyPDFKit } from "easy-pdfkit";
// Define custom formatters
const doc = new EasyPDFKit();

// Add a heading to the document
doc.heading("Hello, World!", 1);
doc.heading("This is a PDF document", 2);

// Add 

// Add table

// 
```

## Tables

This section demonstrates how to create tables using Easy-PDFKit. Currently, the library supports only fixed-layout tables. Support for auto-layout tables is still under development.

Tables can be created using the table method, which accepts a TableConfig object and an array of data objects. The data objects must match the structure defined in the columns property of the TableConfig.

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
  ]
);

```
Type definition for `TableConfig`: 

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
 cellPaddings?: number | { top: number; right: number; bottom: number; left: number };

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
  * The layout mode of the table, determining how the width of each column is calculated.
  * 
  * - `"fixed"`: The table's width is fixed, and each column has a fixed width determined by the following:
  *   - If a `colSpan` property is provided for a column, its width will be calculated as:
  *     (colSpan / totalColSpan) * tableWidth, where `totalColSpan` is the sum of all `colSpan` values in the `columns` array.
  *   - If no `colSpan` is provided, the width will be evenly divided as: (1 / totalColumns) * tableWidth.
  * 
  * - `"auto"`: (Not yet implemented)
  */
 layout: "auto" | "fixed";
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

Easy-PDFKit provides methods for creating headings of various sizes. The following example demonstrates how to create headings h1, h2, h3, h4, h5, and h6.


```typescript

```

## Formatters

By default Easy-PDFKit comes with a built-in formatter which supports the following types: `string`, `number`, `date`, `boolean`, `null`, `undefined`. You can define custom formatters for other data types or override the default formatters by implementing the `Formatter` interface and passing the object to the `formatters` property of the `EasyPDFKit` constructor.

```typescript

```

Although the type is define for the argument of the format function however, the value is not type checked. It is the responsibility of the developer to ensure that the value passed to the format function can in fact be formatted by the function.



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
