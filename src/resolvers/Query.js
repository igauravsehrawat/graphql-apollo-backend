const { forwardTo } = require('prisma-binding');

const Query = {
  async items(parent, args, ctx, info) {
    // If you see in prisma.graphql there is Query but here we using query
    const items = await ctx.db.query.items(args, info);
    return items;
  },

  item: forwardTo('db'),

  itemsConnection: forwardTo('db'),
}

module.exports = Query;
