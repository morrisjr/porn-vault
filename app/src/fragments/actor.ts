import gql from "graphql-tag";

import CustomFieldFragment from "./custom_field";

export default gql`
  fragment ActorFragment on Actor {
    _id
    name
    description
    bornOn
    age
    aliases
    rating
    favorite
    bookmark
    customFields
    availableFields {
      ...CustomFieldFragment
    }
    nationality {
      name
      alpha2
      nationality
    }
  }
  ${CustomFieldFragment}
`;
