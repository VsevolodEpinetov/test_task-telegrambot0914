export default function checkUser (ctx) {
  if (!ctx.session.users) {
    console.log('Fresh db detected! Creating an array of users...')
    ctx.session.users = [];
  }

  if (ctx.session.users.indexOf(ctx.from.id) < 0) {
    console.log(`New user detected! Adding ${ctx.from.id} to the global array`)
    ctx.session.users.push(ctx.from.id);
  }
}