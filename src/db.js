const { Prisma } = require('prisma-binding');

const db = new Prisma({
    typeDefs: './generated/prisma.graphql',
    endPoint: process.env.PRISMA_ENDPOINT,
    secret: process.env.PRISMA_SECRET,
    debug: process.env.DEBUG,
});
module.exports = db;