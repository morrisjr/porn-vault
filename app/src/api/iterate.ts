const ITERATE_TAKE = 24;

export interface PaginationQuery {
  take: number;
  page: number;
}

export async function iterate<T extends { _id: string }>(
  itemCb: (item: T) => void | unknown | Promise<void> | Promise<unknown>,
  fetchPage: (paginationQuery: PaginationQuery) => Promise<T[]>
): Promise<T | void> {
  let more = true;

  for (let page = 0; more; page++) {
    const items = await fetchPage({
      take: ITERATE_TAKE,
      page,
    });

    if (items.length) {
      for (const item of items) {
        const res = await itemCb(item);
        if (res) {
          return item;
        }
      }
    } else {
      more = false;
    }
  }
}
