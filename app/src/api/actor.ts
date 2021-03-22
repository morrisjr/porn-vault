import gql from "graphql-tag";
import ApolloClient from "@/apollo";

const ITERATE_TAKE = 24;

export async function iterate<T extends { _id: string }>(
  itemCb: (item: T) => void | unknown | Promise<void> | Promise<unknown>,
  query?: Record<string, any>
): Promise<T | void> {
  let more = true;

  for (let page = 0; more; page++) {
    const result = await ApolloClient.query({
      query: gql`
        query($query: ActorSearchQuery!) {
          getActors(query: $query) {
            items {
              _id
            }
          }
        }
      `,
      variables: {
        query: {
          ...(query || {}),
          take: ITERATE_TAKE,
          page,
        },
      },
    });

    const items = result.data.getActors.items;

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
