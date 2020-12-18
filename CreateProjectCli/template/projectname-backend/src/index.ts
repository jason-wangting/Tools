// const Koa = require('koa');
import * as Koa from 'koa';
import * as Router from 'koa-router';
// const Router = require('koa-router');
// koa默认body不是json，这里使用koa-boduyparser来parse body
import * as bodyParser from 'koa-bodyparser';

const app = new Koa();
const router = new Router();
// 使用koa-cors来进行cors
const cors = require('koa-cors');
// 使用koa-static来导出静态文件
const staticServer = require('koa-static');
const fs = require('fs')
const path = require('path');
// const open = require('open');
router.post('/add', async (ctx) => {
    const requestBody = ctx.request.body;
    const fileStr = requestBody.str;
    const fileName = requestBody.name;
    const path = requestBody.path;
    console.log(requestBody);
    let err;
    const p = new Promise((resolve, reject) => {

        fs.writeFile(`${path}\\${fileName}.py`, fileStr, (error) => {
            if (error) {
                console.log(error.message);
                err = error;
                reject(error);
            } else {
                console.log('success');
                resolve();
            }
            })


    })
    try {
        await p;
        ctx.response.body = {msg: 'success'};
    } catch (e) {
        ctx.response.body = {msg: err.message};
    }
    
})
app.use(cors());
app.use(bodyParser());
// 这里导出静态文件时表现使用path.join,否则在使用pkg库打包时，没有办法匹配路径
app.use(staticServer(path.join(__dirname, 'public')));
app.use(router.routes());
app.use(router.allowedMethods());
app.listen(3000);
console.log('Server is running in http://localhost:3000');
console.log('Start to open the default browser');
setTimeout(() => {

    // 使用open库打开浏览器
    // open('http://localhost:3000');
    
    // open库实际上是使用了start命令，所以也可以写成下面这样，
    // const cp = require('child_process')
    // cp.exec('start chrome http://localhost:3000');

    // console.log('Default browser is opened.');
    
});