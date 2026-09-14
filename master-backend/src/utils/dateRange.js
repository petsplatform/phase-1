const RANGE_PRESETS = new Set(["all", "today", "last7", "last30", "currentMonth", "previousMonth", "custom"]);

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function resolveDateRange({ range, startDate, endDate } = {}) {
  const key = RANGE_PRESETS.has(range) ? range : "all";
  const now = new Date();

  if (key === "all") {
    return { start: new Date(0), end: endOfDay(now), key };
  }

  if (key === "today") {
    return { start: startOfDay(now), end: endOfDay(now), key };
  }

  if (key === "last7") {
    const start = startOfDay(now);
    start.setDate(start.getDate() - 6);
    return { start, end: endOfDay(now), key };
  }

  if (key === "last30") {
    const start = startOfDay(now);
    start.setDate(start.getDate() - 29);
    return { start, end: endOfDay(now), key };
  }

  if (key === "currentMonth") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: startOfDay(start), end: endOfDay(now), key };
  }

  if (key === "previousMonth") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start: startOfDay(start), end: endOfDay(end), key };
  }

  // custom
  const parsedStart = startDate ? startOfDay(new Date(startDate)) : startOfDay(now);
  const parsedEnd = endDate ? endOfDay(new Date(endDate)) : endOfDay(now);
  if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
    return { start: startOfDay(now), end: endOfDay(now), key: "today" };
  }
  return { start: parsedStart, end: parsedEnd, key };
}

module.exports = { resolveDateRange };
