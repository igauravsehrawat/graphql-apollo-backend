const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { transport, makeANiceEmail } = require('../utils');
const { hasPermission } = require('../utils');

const Mutations = {
  // TODO: Write the authentication layer
  async createItem(parent, args, ctx, info) {
    // If you see in prisma.graphql there is Mutation but here we using mutation
    const item = await ctx.db.mutation.createItem({
      data: {
        user: {
          // This is how to create relatioiship between
          // User and Item
          connect: {
            id: ctx.request.userId,
          }
        },
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
        user: {
          connect: {
            id: ctx.request.userId,
          },
        },
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
    const [ item, user ] = await Promise.all([
      ctx.db.query.item({ where }, `{ id title user { id name } }`),
      ctx.db.query.user({ where: { id: ctx.request.userId } }, `{id permissions}`)
    ]);
    console.log("TCL: deleteItem -> [ item, user ]", [ item, user ])
    // 2. Check permission
    const ownUser = item.user.id === user.id;
    const permissionOrNot = user.permissions.some(permission => ['ADMIN', 'ITEMDELETE'].includes(permission));
    // TODO:
    // 3. Delete Item
    if (!ownUser && !permissionOrNot) {
      // neither you are user, neither you have permission
      throw Error('You don\'t have permissioins!!!');
    }
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
    const user = await ctx.db.query.user({ where: { email: args.email } });
    if (!user) {
        throw Error(`User does not exists by ${args.email}`);
    }
    console.log("TCL: requestReset -> user", user)
    // 2. Generate the reset token and set it to User
    const randomBytesPromisified = promisify(randomBytes);
    const resetToken = (await randomBytesPromisified(20)).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // one hour = 3600000
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry }
    });
    const mailResponse = await transport.sendMail({
      from: 'root@igauravsehrawat.com',
      to: user.email,
      subject: 'Get that reset done',
      html: makeANiceEmail(`
      Here you go
      <p>
      You are ready to reset your password with <a href='${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}'>this</a> link.
      </p>`)
    });
    console.log('updated user', updatedUser, { responseFromMail: mailResponse });
    return {
      message: 'Check inbox for the instructions!.',
    }
    // 3. Send the email for the token

  },
  async resetPassword(parent, args, ctx, info) {
    // 1. Check if password match?
    const { resetToken, password, confirmPassword } = args;
    if (password !== confirmPassword) {
      throw Error('Yo Passwords don\'t match');
    }
    // 2. Check if token exists
    const [user] = await ctx.db.query.users({
      where: {
        resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000,
      }
    }, info);
    if (!user) {
      throw Error('Either token is invalid or expired!.');
    }
    // 3. Check if its valid
    // 4. Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    // 5. Save the new password hash to the user
   const updatedUser = await ctx.db.mutation.updateUser({
     where: {
       email: user.email,
     },
     data: {
       password: hashedPassword,
       resetToken: null,
       resetTokenExpiry: null,
     },
   })
    // 6. Generate JWT
   const token = jwt.sign({
       userId: updatedUser.id,
    }, process.env.APP_SECRET);
    // 7. set JWT token
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 24,
    });
    // 8. return the new user
    return updatedUser;
    // 9. Have A Beer
  },
  async updatePermissions(parent, args, ctx, info) {
    console.log('ctx, updatedUser', args,ctx.request.userId);
    console.log('updatePermissions...');
    // check if user is logged in
    if (!ctx.request.userId) {
      throw Error('You must be logged in!!');
    }
    // check if user has permissions
    const user = await ctx.db.query.user({
      where: {
        id: ctx.request.userId,
      },
    }, info);
    // update the permission
    hasPermission(user, ['ADMIN', 'PERMISSIONUPDATE']);
    // if (!ownUser && !isPermitted) {
    //   throw Error('Operation not permitted');
    // I am not where similar kind of logic used, may be it was flawed
    // }
    const updatedUser = await ctx.db.mutation.updateUser({
      data: {
        permissions: {
          set: args.permissions
        }
      },
      where: {
        id: args.userId
      }
    }, info);
    return updatedUser;
  },
  async addToCart(parent, args, ctx, info) { // paci
    // check if user is logged in
    const itemId = args.id;
    const { userId } = ctx.request;
    if (!userId) {
      throw Error('User must be logged in!!');
    }
    // Query the cart
    const [existingCartItem] = await ctx.db.query.cartItems({
      where: {
        user: userId,
        item: itemId,
      }
    });
    if (existingCartItem) {
      console.log('The items alreayd exists, incrementing...');
      return ctx.db.mutation.updateCartItem({
        where: {
          id: existingCartItem.id,
        },
        data: {
          quantity: existingCartItem.quantity + 1,
        }
      }, info)
    }
    // Check if item already exists
    return ctx.db.mutation.createCartItem({
      data: {
        user: {
          // connect on what field
          connect: { id: userId },
        },
        item: {
          connect: { id: itemId },
        }
      }
    }, info);
  }
};

module.exports = Mutations;
