// ┌————————————————————— Table of Contents —————————————————————┐
// │ 0. Modules and packages                                     │
// │ 1. Scenes                                                   │
// │ 2. DB (PostgreSQL) init                                     │
// │ 3. Triggers                                                 │
// │ 4. Service                                                  │
// └—————————————————————————————————————————————————————————————┘

import dotenv from "dotenv"
dotenv.config();

// --------------------------------------------------------------------------
// 0. Modules and packages
// --------------------------------------------------------------------------
// The bot itself
import { Telegraf, Markup, Telegram, Scenes } from 'telegraf';
const bot = new Telegraf(process.env.BOT_TOKEN)
const telegram = new Telegram(process.env.BOT_TOKEN)

// Misc
import axios from 'axios';
import checkUser from './lib/util.js';

// --------------------------------------------------------------------------
// 1. Scenes
// --------------------------------------------------------------------------
// Handler factories
const { enter, leave } = Scenes.Stage;

// Mailing Scene
// Wait for the message from the user and send it to all OTHER previously registered
// users.
const mailingScene = new Scenes.BaseScene('mailingScene');;
mailingScene.enter(ctx => {
  ctx.replyWithHTML('<b>Введите сообщение, которое хотите отправить всем пользователям.</b>')
})
mailingScene.on('text', async (ctx) => {
  await ctx.reply(`Понял! Отправляю всем пользователям сообщение:\n\n${ctx.message.text}`)
  let counter = 0;
  await ctx.session.users.forEach(async userID => {
    if (userID !== ctx.from.id) {
      counter++;
      await telegram.sendMessage(
        userID,
        `Тебе новое сообщение!\n\n<i>${ctx.message.text}</i>`,
        { parse_mode: 'HTML' }
      )
    }
  })
  ctx.reply(`Готово! Отправил сообщение ${counter} пользователям.`)
  return ctx.scene.leave();
})
mailingScene.on('message', (ctx) => {
  ctx.replyWithHTML(`Ожидаю от тебя только и исключительно <b>текстовое</b> сообщение!`)
})
mailingScene.leave(ctx => {});

const stage = new Scenes.Stage([mailingScene]);

// --------------------------------------------------------------------------
// 2. DB (PostgreSQL) init
// --------------------------------------------------------------------------
import PostgresSession from 'telegraf-postgres-session'; // be aware that I made a teeny-tine custom change to the package
bot.use((new PostgresSession({
  connectionString: process.env.DATABASE_URL,
  ssl: false
}, 'global')).middleware());
bot.use(stage.middleware()); // it should be exactly here.


// --------------------------------------------------------------------------
// 3. Triggers
// --------------------------------------------------------------------------

// Command '/start'
// Greets user and offers 3 button to press
bot.command('start', (ctx) => {
  checkUser(ctx);
  ctx.reply('Здравствуйте. Нажмите на любую интересующую Вас кнопку.', {
    parse_mode: 'HTML',
    ...Markup.keyboard([
      ["Погода в Канаде"],
      ["Хочу почитать!"],
      ["Сделать рассылку"]
    ])
  });
})

// Message 'Погода в Канаде'
// Send a http request to the open-meteo.com, parse info
// and edit an initial message with the gotten information.
// Hard coded to get the weather for Vancouver
bot.hears('Погода в Канаде', (ctx) => {
  checkUser(ctx);
  ctx.reply('Получаю информацию...').then((nctx) => {
    axios
      .get('https://api.open-meteo.com/v1/forecast?latitude=49.25&longitude=-123.12&current_weather=true')
      .then(res => {
        const info = res.data.current_weather;
        ctx.telegram.editMessageText(nctx.chat.id, nctx.message_id, undefined, `<b>Текущая погода</b>\n\n📍<b>Место:</b> Канада, Ванкувер\n🌡<b>Температура:</b> ${info.temperature}\n🌬<b>Ветер:</b> ${info.windspeed} км/ч, ${info.winddirection}°`, { parse_mode: 'HTML' });
      })
      .catch(error => {
        console.error(error);
      });
  })
})

// Message 'Хочу почитать!'
// Sends 2 messages. First one is the photo of a book cover gotten from the direct
// url. Photo has a caption.
// Second message is a file message with a zip-archive from the direct url as well.
bot.hears('Хочу почитать!', async (ctx) => {
  checkUser(ctx);

  await ctx.replyWithPhoto('https://pythonist.ru/wp-content/uploads/2020/03/photo_2021-02-03_10-47-04-350x2000-1.jpg',
    { caption: 'Идеальный карманный справочник для быстрого ознакомления с особенностями работы разработчиков на Python. Вы найдете море краткой информации о типах и операторах в Python, именах специальных методов, встроенных функциях, исключениях и других часто используемых стандартных модулях.' })
  ctx.replyWithDocument('https://drive.google.com/u/0/uc?id=1Xs_YjOLgigsuKl17mOnR_488MdEKloCD&export=download')
})

// Message 'Сделать рассылку!
// Sends a message with 2 inline buttons.
// First option allows to send a message to all previously registered users.
// Second options cancels the request.
bot.hears('Сделать рассылку', (ctx) => {
  checkUser(ctx);

  ctx.reply('Вы выбрали рассылку всем пользователям. Вы уверены, что хотите это сделать?', {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      Markup.button.callback('✅ Уверен', `affirm-dialogue`),
      Markup.button.callback('🚫 Отмена', `cancel-dialogue`)
    ])
  })
})

// Action 'affirm-dialogue'
// Clears the keyboard and enters the mailingScene.
bot.action('affirm-dialogue', async ctx => {
  ctx.editMessageReplyMarkup();
  return ctx.scene.enter('mailingScene');
})

// Action 'cancel-dialogue'
// Clears the keyboard and sends a message with confirmation of cancellation.
bot.action('cancel-dialogue', async ctx => {
  ctx.editMessageReplyMarkup();
  ctx.reply('Окей, но если передумаешь - я всегда тут :)')
})

// Every other message
// Sens a proposition to execute the /start command.
bot.on('message', ctx => {
  ctx.reply('Попробуй написать /start, если кнопки вдруг потерялись!')
});


// --------------------------------------------------------------------------
// 4. Service
// --------------------------------------------------------------------------
bot.launch()
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))