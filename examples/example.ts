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
