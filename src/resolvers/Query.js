const { forwardTo } = require('prisma-binding');
const { hasPermission } = require('../utils');

const Query = {
  async items(parent, args, ctx, info) {
    // If you see in prisma.graphql there is Query but here we using query
    const items = await ctx.db.query.items(args, info);
    return items;
  },

  item: forwardTo('db'),

  itemsConnection: forwardTo('db'),
  me(parent, args, ctx, info) {
    const userId = ctx.request.userId;
    if (userId) {
      return ctx.db.query.user({
        where: {
          id: userId
        }
      }, info);
    } else {
      return null;
    }
  },
  users(parent, args, ctx, info) {
    // 1. check if user has permission to query
    if (!ctx.request.userId) {
      throw Error ('You need to be logged in!!');
    }
    hasPermission(ctx.request.user[0], ['ADMIN', 'PERMISSIONUPDATE']);
    // 2. fetch the cusers
    return ctx.db.query.users({}, info);
  },
  async order(parent, args, ctx, info) {
    // check if user is logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in!')
    }
    // query the order
    const order = await ctx.db.query.order({
      where: {
        id: args.id,
      }
    }, info);
    // info to send the field frontend is asking for
    // check if they have PERMISSION to see it, hmm
    const ownPermissions = ctx.request.userId === order.user.id;
    const hasPermissions = ctx.request.user.permissions.includes('ADMIN');
    // return the order
    if (!ownPermissions && !hasPermissions) {
      throw new Error('You do not have permissions budd');
    }
    return order;
  }
}

module.exports = Query;
