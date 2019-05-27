const { GraphQLServer } =require('graphql-yoga');
const Mutation = require('./resolvers/Mutation');
const Query = require('./resolvers/Query');
const db = require('./db');

const createServer = new GraphQLServer({
    typeDefs: 'src/schema.graphql',
    resolvers: {
        Mutation,
        Query,
    },
    resolverValidatingOptions: {
        requireResolversForResolveType: false,
    },
    context: req => ({ ...req, db }),
});

module.exports = createServer;