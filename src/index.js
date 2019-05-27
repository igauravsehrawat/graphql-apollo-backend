// let's go! yup
require('dotenv').config({ path: 'variables.env' });
const createServer = require('./createServer');
const db = require('./db');

// TODO:Use express middleware for authentication(JWT)
// TODO: Use express middleware for populating users
const server = createServer();

server.start({
    cors: {
        credentials: true,
        origin: process.env.FRONTEND_URL,
    },
  },
  deets => {
    console.log(`Server running now on url
      localhost:${deets.port}
    `);
  },
);