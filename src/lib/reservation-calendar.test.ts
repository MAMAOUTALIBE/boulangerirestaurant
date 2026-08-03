import { describe, expect, it } from "vitest";
import {
  buildGoogleCalendarUrl,
  buildReservationIcs,
} from "@/lib/reservation-calendar";

const reservation = {
  reference: "RV-ABC123",
  date: "2099-08-03",
  time: "20:00",
  guests: 2,
  notes: "Anniversaire",
};

describe("calendrier de réservation", () => {
  it("construit un lien Google Calendar dans le fuseau de Paris", () => {
    const url = new URL(
      buildGoogleCalendarUrl(reservation, "Lawale Simbo", "Bagnolet"),
    );
    expect(url.hostname).toBe("calendar.google.com");
    expect(url.searchParams.get("dates")).toBe(
      "20990803T200000/20990803T220000",
    );
    expect(url.searchParams.get("ctz")).toBe("Europe/Paris");
  });

  it("génère un événement ICS complet", () => {
    const ics = buildReservationIcs(reservation, "Lawale Simbo", "Bagnolet");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART;TZID=Europe/Paris:20990803T200000");
    expect(ics).toContain("DTEND;TZID=Europe/Paris:20990803T220000");
    expect(ics).toContain("RV-ABC123");
  });
});
