import gql from "graphql-tag";

export default gql`
  fragment CustomFieldFragment on CustomField {
    _id
    name
    type
    values
    unit
    target
    highlightedWebsite
    icon
  }
`;
