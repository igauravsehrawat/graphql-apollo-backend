const nodemailer = require('nodemailer');

function hasPermission(user, permissionsNeeded) {
  const matchedPermissions = user.permissions.filter(permissionTheyHave =>
    permissionsNeeded.includes(permissionTheyHave)
  );
  if (!matchedPermissions.length) {
    throw new Error(`You do not have sufficient permissions

      : ${permissionsNeeded}

      You Have:

      ${user.permissions}
      `);
  }
}
const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_AUTH_USER,
    pass: process.env.MAIL_AUTH_PASS,
  }
});

const makeANiceEmail = text => {
  const template = `
    <body style="
      color:black;
      border:1px solid;
      padding:20px;
      font-family: san-serif;
      font-size: 20px;
    ">
      <h2> Hello there </h2>
      ${text}

      <p>
      From,
      Gaurav 😘
      </p>
    </body>
  `
  return template;
}

exports.hasPermission = hasPermission;
exports.transport = transport;
exports.makeANiceEmail = makeANiceEmail;
