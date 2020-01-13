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
    if (!ctx.request.user) {
      throw Error ('You need to be logged in!!');
    }
    hasPermission(ctx.request.user[0], ['ADMIN', 'PERMISSIONUPDATE']);
    // 2. fetch the cusers
    return ctx.db.query.users({}, info);
  }
}

module.exports = Query;
