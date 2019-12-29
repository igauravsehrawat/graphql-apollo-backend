const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');

const Mutations = {
  // TODO: Write the authentication layer
  async createItem(parent, args, ctx, info) {
    // If you see in prisma.graphql there is Mutation but here we using mutation
    const item = await ctx.db.mutation.createItem({
      data: {
        ...args
      },
    }, info);
    return item;
  },

  updateItem(parent, args, ctx, info) {
    const updateData = { ...args };
    delete updateData.id;
    return ctx.db.mutation.updateItem({
      data: {
        ...updateData
      },
      where: {
        id: args.id
      }
    },
      info
    )
  },

  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };
    // 1. Check if item exists
    const item = await ctx.db.query.item({ where }, `{ id title }`);
    // 2. Check permission
    // TODO:
    // 3. Delete Item
    return ctx.db.mutation.deleteItem({ where }, info);
  },

  async signup(parent, args, ctx, info) {
    args.email = args.email.toLowerCase();
    const password = await bcrypt.hash(args.password, 10);
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ['USER'] }
        }
      }, info
    );
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 24,
    });
    return user;
  },

  // notice the destructing of the args
  async signin(parent, { email, password }, ctx, info) {
    const user = await ctx.db.query.user({ where: { email } });
    if (!user) {
      throw Error(`User does not exists by ${email}`);
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw Error('Password entered is not correct.');
    }
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 24,
    });
    return user;
  },
  signout(parent, args, ctx, info) {
    ctx.response.clearCookie('token');
    return {
      message: 'Goodbye;)',
    }
  },
  async requestReset (parent, args, ctx, info) {
  // 1. Check if user exists
  const user = ctx.db.query.user({ where: { email: args.email } });
  if (!user) {
      throw Error(`User does not exists by ${args.email}`);
  }
  // 2. Generate the reset token and set it to User
  const randomBytesPromisified = promisify(randomBytes);
  const resetToken = (await randomBytesPromisified(20)).toString('hex');
  const resetTokenExpiry = Date.now() + 3600000; // one hour = 3600000
  const updatedUser = await ctx.db.mutation.updateUser({
    where: { email: args.email },
    data: { resetToken, resetTokenExpiry }
  });
  console.log('updated user', updatedUser);
  return {
    message: 'Check inbox for the instructions!.',
  }
  // 3. Send the email for the token
  }
};

module.exports = Mutations;
