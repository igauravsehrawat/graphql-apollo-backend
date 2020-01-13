// let's go! yup
require('dotenv').config({ path: 'variables.env' });
const createServer = require('./createServer');
const cookieParser = require('cookie-parser');
const db = require('./db');
const jwt = require('jsonwebtoken');

// TODO:Use express middleware for authentication(JWT)
// TODO: Use express middleware for populating users
const server = createServer();
server.express.use(cookieParser());

server.express.use((req, res, next) => {
  console.log(req.cookies);
  const { token } = req.cookies;
  if (token) {
    const { userId } = jwt.verify(token, process.env.APP_SECRET);
    if (userId) {
      // to be used in future for keep track of the user
      req.userId = userId;
    }
  }
  return next();
});

// populating the user
server.use(async (req, res, next) => {
  if (!req.userId) {
    return next();
  }
  // also populate all the fields required
  const user = await db.query.users({ where: {
    id: req.userId,
  }}, '{ id, email, name, permissions }');
  req.user = user;
  return next();
});

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
