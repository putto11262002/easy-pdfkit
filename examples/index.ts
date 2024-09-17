import { PDFDoc } from "easy-pdfkit";
import fs from "fs";
const doc = new PDFDoc({ header: "Header" });

doc.pipe(fs.createWriteStream("output.pdf"));

doc.h1("Headings", { underline: true });

doc.h1("Heading 1");

doc.h2("Heading 2");

doc.h3("Heading 3");

doc.h4("Heading 4");

doc.h5("Heading 5");

doc.h6("Heading 6");

doc.normal("This is a paragraph");

doc.moveDown().h1("Fixed Layout Table", { underline: true });

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

doc.fixedLayoputTable(
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
