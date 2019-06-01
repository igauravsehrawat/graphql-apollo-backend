const Mutations = {
  createDog(parent, args, ctx, info) {
    console.log('The args for the mutation are', args);
  }
};

module.exports = Mutations;
