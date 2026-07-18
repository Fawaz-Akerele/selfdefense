export type DirectionsSnapshot = {
  venueName: string;
  address: string;
  city: string;
  state: string;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
  directionsUrl: string;
  mapEmbedUrl: string;
  staticMapUrl: string;
};

export function buildDirectionsSnapshot(location: {
  venue_name?: string | null;
  address?: string | null;
  city: string;
  state: string;
  landmark?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): DirectionsSnapshot {
  const venueName = location.venue_name ?? `Sydef — ${location.city}`;
  const address = location.address ?? `${location.city}, ${location.state}, Nigeria`;
  const lat = location.latitude ?? null;
  const lng = location.longitude ?? null;

  const destination =
    lat !== null && lng !== null
      ? `${lat},${lng}`
      : encodeURIComponent(`${address}, Nigeria`);

  const query = encodeURIComponent(`${venueName}, ${address}`);

  return {
    venueName,
    address,
    city: location.city,
    state: location.state,
    landmark: location.landmark ?? null,
    latitude: lat,
    longitude: lng,
    directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
    mapEmbedUrl:
      lat !== null && lng !== null
        ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`
        : `https://maps.google.com/maps?q=${query}&output=embed`,
    staticMapUrl:
      lat !== null && lng !== null
        ? `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=15&size=640x320&markers=${lat},${lng},red-pushpin`
        : "",
  };
}

export function formatReminderBody(
  classTitle: string,
  sessionStart: string,
  snapshot: DirectionsSnapshot
): string {
  const when = new Date(sessionStart).toLocaleString("en-NG", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let body = `Reminder: ${classTitle} starts ${when}.\n\n`;
  body += `📍 ${snapshot.venueName}\n${snapshot.address}\n`;
  if (snapshot.landmark) body += `Landmark: ${snapshot.landmark}\n`;
  body += `\nGet directions: ${snapshot.directionsUrl}`;
  if (snapshot.staticMapUrl) body += `\nMap: ${snapshot.staticMapUrl}`;

  return body;
}
