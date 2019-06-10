const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

  async createUser(parent, args, ctx, info) {
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
  }
};

module.exports = Mutations;
