import { PDFDoc } from "../src";
import fs from "fs";

const doc = new PDFDoc({ header: "Header" });
doc.pipe(fs.createWriteStream("example.pdf"));

doc.h1("Hello world!");
