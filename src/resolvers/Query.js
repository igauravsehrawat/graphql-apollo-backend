const Query = {
  // just write the function, type check is done differently
  // not the typescript way
  dogs(parent, args, ctx, info) {
    console.log('The args are', args);
  }
}

module.exports = Query;
