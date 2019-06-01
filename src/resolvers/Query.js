const Query = {
  // just write the function, type check is done differently
  // not the typescript way
  dogs(parent, args, ctx, info) {
    global.dogs = global.dogs || [];
    return global.dogs;
  }
}

module.exports = Query;
