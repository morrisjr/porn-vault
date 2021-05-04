import ApolloClient from "@/apollo";
import gql from "graphql-tag";

export async function removeLabelFromItem(itemId: string, labelId: string): Promise<void> {
  await ApolloClient.mutate({
    mutation: gql`
      mutation($item: String!, $label: String!) {
        removeLabel(item: $item, label: $label)
      }
    `,
    variables: {
      item: itemId,
      label: labelId,
    },
  });
}
