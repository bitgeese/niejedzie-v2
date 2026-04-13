const API_BASE = "https://pdp-api.plk-sa.pl";
const MAX_ATTEMPTS = 3;

export interface RouteDto {
  scheduleId: number;
  orderId: number;
  trainOrderId?: number;
  name?: string | null;
  carrierCode?: string | null;
  nationalNumber?: string | null;
  internationalDepartureNumber?: string | null;
  internationalArrivalNumber?: string | null;
  commercialCategorySymbol?: string | null;
  operatingDates?: string[];
  stations?: ScheduleStationDto[];
}

export interface ScheduleStationDto {
  stationId: number;
  orderNumber: number;
  arrivalTime?: string;
  departureTime?: string;
}

export interface OperationStationDto {
  stationId: number;
  plannedArrival?: string | null;
  plannedDeparture?: string | null;
  actualArrival?: string | null;
  actualDeparture?: string | null;
  arrivalDelayMinutes?: number;
  departureDelayMinutes?: number;
  isCancelled?: boolean;
}

export interface TrainOperationDto {
  scheduleId: number;
  orderId: number;
  operatingDate: string;
  trainStatus: string | null;
  stations: OperationStationDto[];
}

export interface StatisticsResponse {
  totalTrains: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  partialCancelled: number;
}

export function extractTrainNumber(route: RouteDto): string {
  for (const key of [
    "nationalNumber",
    "internationalDepartureNumber",
    "internationalArrivalNumber",
    "name",
  ] as const) {
    const v = route[key];
    if (typeof v === "string" && v.trim() !== "") return v.trim();
  }
  return `${route.scheduleId}/${route.orderId}`;
}

async function pkpFetch<T>(
  path: string,
  apiKey: string,
  params?: Record<string, string>,
): Promise<T | null> {
  const url = new URL(path, API_BASE);
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        headers: { "X-API-Key": apiKey, Accept: "application/json" },
      });
      if (res.ok) return (await res.json()) as T;
      if (res.status < 500 || attempt === MAX_ATTEMPTS) {
        console.error(`[pkp] ${res.status} on ${path}`);
        return null;
      }
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) {
        console.error(`[pkp] network error on ${path}: ${err}`);
        return null;
      }
    }
    await new Promise((r) => setTimeout(r, 500 * attempt));
  }
  return null;
}

export async function fetchStatistics(apiKey: string, date: string): Promise<StatisticsResponse | null> {
  return pkpFetch<StatisticsResponse>("/api/v1/operations/statistics", apiKey, { date });
}

export async function fetchOperationsPage(
  apiKey: string,
  page: number,
  pageSize = 2000,
): Promise<{ trains: TrainOperationDto[]; stations: Record<string, string>; hasNextPage: boolean } | null> {
  const res = await pkpFetch<{
    trains: TrainOperationDto[];
    stations: Record<string, string>;
    pagination: { hasNextPage: boolean };
  }>("/api/v1/operations", apiKey, {
    fullRoutes: "true",
    withPlanned: "true",
    page: String(page),
    pageSize: String(pageSize),
  });
  if (!res) return null;
  return { trains: res.trains, stations: res.stations, hasNextPage: res.pagination.hasNextPage };
}

export async function fetchAllStations(apiKey: string): Promise<{ id: number; name: string }[]> {
  const seen = new Map<number, string>();
  const prefixes = "abcdefghijklmnopqrstuvwxyząćęłńóśźż0123456789".split("");
  for (const p of prefixes) {
    const res = await pkpFetch<{ stations: { id: number; name: string }[] }>(
      "/api/v1/dictionaries/stations",
      apiKey,
      { search: p },
    );
    if (!res || !Array.isArray(res.stations)) continue;
    for (const s of res.stations) seen.set(s.id, s.name);
  }
  return Array.from(seen, ([id, name]) => ({ id, name }));
}

export async function fetchSchedules(
  apiKey: string,
  date: string,
): Promise<{ routes: RouteDto[]; stations: Record<string, string> } | null> {
  const res = await pkpFetch<{
    routes: RouteDto[];
    dictionaries?: { stations?: Record<string, { name: string } | string> };
  }>("/api/v1/schedules", apiKey, {
    dateFrom: date,
    dateTo: date,
    dictionaries: "true",
    pageSize: "10000",
  });
  if (!res) return null;
  const stations: Record<string, string> = {};
  for (const [sid, info] of Object.entries(res.dictionaries?.stations ?? {})) {
    stations[sid] = typeof info === "string" ? info : info.name;
  }
  return { routes: res.routes, stations };
}
