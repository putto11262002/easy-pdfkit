import { PDFDoc, type MultiTypeTextFormatter } from "easy-pdfkit";
import fs from "fs";

// Represents a point in 2D space
class Point {
  public x: number;
  public y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

// Implement custom formatter for Point
const customFormatter: MultiTypeTextFormatter<Point> = (value) => {
  // Always check if the value passed in is in fact a Point
  if (value instanceof Point) {
    return `(${value.x}, ${value.y})`;
  }

  // Returning null indicate that the formatter cannot format the value
  return null;
};

const doc = new PDFDoc({
  formatter: customFormatter,
});

doc.pipe(fs.createWriteStream("single-formatter.output.pdf"));
doc.multiTypeText(false); // -> No
doc.multiTypeText(123); // -> 123
doc.multiTypeText(new Date()); // -> 2021-09-01
doc.multiTypeText(new Point(0, 0));

doc.end();
