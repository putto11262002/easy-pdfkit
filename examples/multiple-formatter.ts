import { PDFDoc, type MultiTypeTextFormatter } from "easy-pdfkit";
import fs from "fs";

// Class represnts a passenger
class Passenger {
  constructor(
    public name: string,
    public seatNum: string,
    public flight: Flight,
  ) {
    this.name = name;
    this.seatNum = seatNum;
    this.flight = flight;
  }
}

// Class represents a flight
class Flight {
  constructor(
    public flightNum: string,
    public origin: string,
    public destination: string,
  ) {
    this.flightNum = flightNum;
    this.origin = origin;
    this.destination = destination;
  }
}

// Implement custom formatter for Point
const customFormatter: MultiTypeTextFormatter<Passenger | Flight> = (value) => {
  // Always check if the value passed in is an instance of the Passenger class
  if (value instanceof Passenger) {
    return `${value.name} seated at ${value.seatNum} on ${value.flight.flightNum}`;
  }

  // Always check if the value passed in is an instance of the Flight class
  if (value instanceof Flight) {
    return `${value.flightNum} from ${value.origin} to ${value.destination}`;
  }

  // Returning null indicate that the formatter cannot format the value
  return null;
};

const doc = new PDFDoc({
  formatter: customFormatter,
});

doc.pipe(fs.createWriteStream("multiple-formatter.output.pdf"));
const flight = new Flight("BA123", "LHR", "JFK");
const passenger = new Passenger("John Doe", "1A", flight);
doc.multiTypeText(flight);
doc.multiTypeText(passenger);

doc.end();
