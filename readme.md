# Тестовое задание от 14 сентября 2022г.
### Установка и настройка бота
```sh
# Клонируем репозиторий
git clone https://github.com/VsevolodEpinetov/test_task-telegrambot0914.git

# Инициализируем npm
npm install
```

После этого в файле `/node_modules/telegraf-postgres-session/src/index.js` меняем строчки с 4 по 14 на:
```js
class PostgresSession {
	constructor (options, customSessionKey) { // ', customSessionKey' added
		this.options = Object.assign({
			property: 'session',
		}, options);
    this.customSessionKey = customSessionKey;  // added
	}
	
	getSessionKey(ctx) {
    if (this.customSessionKey) return this.customSessionKey; // added
		let chat_id = '';
```

В файл `.env` добавить константы:
```
BOT_TOKEN="TELEGRAM_BOT_TOKEN"
DATABASE_URL="POSTGRESQL_DB_URL"
```
Чтобы получить токен для телеграм бота, свяжитесь с [BotFather](https://t.me/BotFather).
Примеры ссылок на БД PostgreSQL: [тык](https://stackoverflow.com/questions/3582552/what-is-the-format-for-the-postgresql-connection-string-url).
### Настройка PostgreSQL
После установки [PostgreSQL](https://www.postgresql.org/download/) необходимо в БД создать таблицу командой:
```sql
CREATE TABLE postgress_sessions(id varchar PRIMARY KEY, session varchar);
```

### Запуск бота
Запускается из родительской папки командой
```
node index.js
```

## Функционал

| Команда/триггер | Поведение |
| ------ | ------ |
| Команда /start | Записывает данные о пользователе в БД, предлагает на выбор 3 функциональные кнопки: “Погода в Канаде”, “Хочу почитать!” и “Сделать рассылку” |
| Текст "Погода в Канаде" | Пользователю отправляется сообщение с текущей погоды в Канада, Ванкувер (температура, скорость ветра, направление ветра) |
| Текст "Хочу почитать!" | Отправляет пользователю два сообщения: первое - с обложкой книги и описанием, второе - с zip-архивом |
| Текст "Сделать рассылку" | Сообщением с двумя кнопками предлагает пользователю сделать рассылку всем остальным пользователям. При согласии запрашивает текст, отправляет его всем другим пользователям и уведомляет автора. При отказе заканчивает диалог. |