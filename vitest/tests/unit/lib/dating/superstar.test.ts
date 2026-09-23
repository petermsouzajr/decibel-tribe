import { describe, expect, it } from "vitest";
import { refreshSuperstars, spendSuperstar, SUPERSTAR_WEEK_MS } from "@/lib/dating/superstar";

const start = new Date("2026-01-01T00:00:00.000Z");

describe("superstar bank", () => {
  it("starts with one star and grants the next one a week later", () => {
    const fresh = refreshSuperstars(1, null, start, start);
    expect(fresh.balance).toBe(1);

    const nextWeek = refreshSuperstars(1, null, start, new Date(start.getTime() + SUPERSTAR_WEEK_MS));
    expect(nextWeek.balance).toBe(2);
  });

  it("banks at most 3", () => {
    const later = new Date(start.getTime() + SUPERSTAR_WEEK_MS * 10);
    expect(refreshSuperstars(1, null, start, later).balance).toBe(3);
  });

  it("lets a full bank be spent immediately, then waits a week for the next star", () => {
    const now = new Date(start.getTime() + SUPERSTAR_WEEK_MS * 3);
    const full = refreshSuperstars(1, null, start, now);
    expect(full.balance).toBe(3);

    const first = spendSuperstar(full.balance, full.nextAt, start, now);
    const second = spendSuperstar(first.balance, first.nextAt, start, now);
    const third = spendSuperstar(second.balance, second.nextAt, start, now);
    expect(first.ok && second.ok && third.ok).toBe(true);
    expect(third.balance).toBe(0);

    const tooSoon = spendSuperstar(third.balance, third.nextAt, start, now);
    expect(tooSoon.ok).toBe(false);

    const afterWeek = refreshSuperstars(
      third.balance,
      third.nextAt,
      start,
      new Date(now.getTime() + SUPERSTAR_WEEK_MS),
    );
    expect(afterWeek.balance).toBe(1);
  });
});
