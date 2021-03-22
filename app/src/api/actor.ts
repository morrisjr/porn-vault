import ApolloClient from "@/apollo";
import gql from "graphql-tag";

import { iterate } from "./iterate";

export class Actor {
  static async iterate<T extends { _id: string }>(
    itemCb: (item: T) => void | unknown | Promise<void> | Promise<unknown>,
    searchQuery?: Record<string, any>
  ): Promise<T | void> {
    return iterate(itemCb, (paginationQuery) =>
      ApolloClient.query({
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
            ...(searchQuery || {}),
            ...paginationQuery,
          },
        },
      }).then((res) => res.data.getActors.items)
    );
  }
}
