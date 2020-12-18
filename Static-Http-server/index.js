const Koa = require('koa');
const Koa_static = require('koa-static');
const app = new Koa();
const path = require('path');

app.use(Koa_static(path.join(__dirname, 'public')))

console.log('server is running in the http://localhost:8887');
app.listen(8887);