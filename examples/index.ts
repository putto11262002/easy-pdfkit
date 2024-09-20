import { PDFDoc } from "easy-pdfkit";
import fs from "fs";
const doc = new PDFDoc({ header: "Header" });

doc.pipe(fs.createWriteStream("output.pdf"));

doc.heading("Headings", "h1", { underline: true });
doc.heading("Heading 1", "h1");
doc.heading("Heading 2", "h2");
doc.heading("Heading 3", "h3");
doc.heading("Heading 4", "h4");
doc.heading("Heading 5", "h5");
doc.heading("Heading 6", "h6");
doc.heading("normal text", "normal");

doc.moveDown().heading("Fixed Layout Table", "h1", { underline: true });

const data = [
  {
    date: new Date("2024-09-01"),
    is_published: true,
    title: "Neovim Tips and Tricks",
    views: 1000,
  },
  {
    date: new Date("2023-12-25"),
    is_published: false,
    title: "Draft: Christmas Gift Ideas",
    views: 0,
  },
  {
    date: new Date("2025-01-01"),
    is_published: true,
    title: "New Year's Resolutions for Developers",
    views: 500,
  },
  {
    date: new Date("2024-07-04"),
    is_published: true,
    title: "History of the United States",
    views: 200,
  },
  {
    date: new Date("2024-02-14"),
    is_published: false,
    title: "Draft: Romantic Ideas for Valentine's Day",
    views: 0,
  },
];

doc.table(
  {
    columns: [
      { key: "title", header: "Tite", colSpan: 2 },
      { key: "date", header: "Date" },
      { key: "is_published", header: "Published" },
      { key: "views", header: "Views" },
    ],
  },
  data,
);

doc.end();
