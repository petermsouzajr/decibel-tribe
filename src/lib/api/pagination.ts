/**
 * Cursor pagination helpers.
 *
 * Convention: the cursor is the **last item returned to the client**, and the
 * next query skips it (`skip: 1`). This is Prisma's documented cursor pattern.
 *
 * Before this helper existed, each route hand-rolled the skip/index arithmetic
 * and five of them got it wrong — silently dropping or duplicating one row at
 * page boundaries. Use `cursorArgs` + `paginate` together; they are two halves
 * of one convention and mixing either with hand-written index maths reopens
 * those bugs.
 */

export const DEFAULT_PAGE_SIZE = 10;

/**
 * Prisma `findMany` args for an exclusive cursor.
 *
 * Over-fetches one row so `paginate` can tell whether another page exists
 * without a second count query. Pass the full Prisma cursor object, which may
 * be a composite key (e.g. `{ userId_groupId: { userId, groupId } }`).
 */
export function cursorArgs<TCursor>(
  cursor: TCursor | null | undefined,
  pageSize: number = DEFAULT_PAGE_SIZE,
) {
  return {
    take: pageSize + 1,
    ...(cursor ? { cursor, skip: 1 } : {}),
  };
}

/**
 * Split an over-fetched row set into the page to return and the next cursor.
 *
 * `nextCursor` is the id of the **last returned** row, matching `cursorArgs`'
 * `skip: 1`. It is `null` when there are no further pages.
 *
 * @param getId reads the cursor value from a row. Defaults to `row.id`; pass it
 *   explicitly when the cursor is a nested or renamed field.
 */
export function paginate<TRow>(
  rows: TRow[],
  pageSize: number = DEFAULT_PAGE_SIZE,
  getId: (row: TRow) => string = (row) => (row as { id: string }).id,
): { items: TRow[]; nextCursor: string | null } {
  const hasNextPage = rows.length > pageSize;
  const items = hasNextPage ? rows.slice(0, pageSize) : rows;

  return {
    items,
    nextCursor:
      hasNextPage && items.length > 0 ? getId(items[items.length - 1]) : null,
  };
}
