import { PDFDoc } from "easy-pdfkit";
import fs from "fs";

const doc = new PDFDoc({
  headingConfig: { h1: { textOptions: { underline: true } }, h2: { size: 18 } }, // Define custom heading sizes for h1 and h2
});
doc.pipe(fs.createWriteStream("heading.output.pdf"));

doc.heading("heading", "h1");
doc.heading("sub heading", "h2");
doc.heading("sub sub heading", "h3");

doc.end();
