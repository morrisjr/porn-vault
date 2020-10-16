import { gql } from "apollo-server-express";

export default gql`
  type StudioSearchResults {
    numItems: Int!
    numPages: Int!
    items: [Studio!]!
  }

  input StudioSearchQuery {
    query: String
    favorite: Boolean
    bookmark: Boolean
    # rating: number;
    include: [String!]
    exclude: [String!]
    sortBy: String
    sortDir: String
    skip: Int
    take: Int
    page: Int
  }

  extend type Query {
    numStudios: Int!
    getStudios(query: StudioSearchQuery!, seed: String): StudioSearchResults!
    getStudioById(id: String!): Studio
  }

  type Studio {
    _id: String!
    name: String!
    description: String
    addedOn: Long!
    favorite: Boolean!
    bookmark: Long
    customFields: Object!
    aliases: [String!]

    # Resolvers
    parent: Studio
    substudios: [Studio!]!
    numScenes: Int!
    thumbnail: Image
    rating: Int # Inferred from scene ratings
    scenes: [Scene!]!
    labels: [Label!]! # Inferred from scene labels
    actors: [Actor!]! # Inferred from scene actors
    movies: [Movie!]!
    availableFields: [CustomField!]!
  }

  input StudioUpdateOpts {
    name: String
    description: String
    thumbnail: String
    favorite: Boolean
    bookmark: Long
    parent: String
    labels: [String!]
    aliases: [String!]
  }

  extend type Mutation {
    addStudio(name: String!): Studio!
    updateStudios(ids: [String!]!, opts: StudioUpdateOpts!): [Studio!]!
    removeStudios(ids: [String!]!): Boolean!
    runStudioPlugins(ids: [String!]!): [Studio!]!
    runAllStudioPlugins: [Studio!]!
  }
`;
