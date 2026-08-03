export interface ReservationCalendarData {
  reference: string;
  date: string;
  time: string;
  guests: number;
  notes?: string;
}

function compactDateTime(date: string, time: string): string {
  return `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;
}

function addHours(time: string, hours: number): string {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + hours * 60;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Lien Google Calendar, interprété explicitement dans le fuseau de Paris. */
export function buildGoogleCalendarUrl(
  reservation: ReservationCalendarData,
  restaurantName: string,
  address: string,
): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Réservation ${restaurantName}`,
    dates: `${compactDateTime(reservation.date, reservation.time)}/${compactDateTime(reservation.date, addHours(reservation.time, 2))}`,
    ctz: "Europe/Paris",
    location: address,
    details: `Table pour ${reservation.guests} personne(s) — référence ${reservation.reference}${reservation.notes ? ` — ${reservation.notes}` : ""}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function icsEscape(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n");
}

/** Fichier calendrier standard pour Apple Calendar, Outlook et autres agendas. */
export function buildReservationIcs(
  reservation: ReservationCalendarData,
  restaurantName: string,
  address: string,
): string {
  const description = `Table pour ${reservation.guests} personne(s) — référence ${reservation.reference}${reservation.notes ? ` — ${reservation.notes}` : ""}`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lawale Simbo//Reservation//FR",
    "BEGIN:VEVENT",
    `UID:${reservation.reference}@reservation`,
    `DTSTART;TZID=Europe/Paris:${compactDateTime(reservation.date, reservation.time)}`,
    `DTEND;TZID=Europe/Paris:${compactDateTime(reservation.date, addHours(reservation.time, 2))}`,
    `SUMMARY:${icsEscape(`Réservation ${restaurantName}`)}`,
    `LOCATION:${icsEscape(address)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
