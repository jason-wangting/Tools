#! node

// 文件执行环境解释
// #! node是声明这个文件需要使用node来打开，这是window系统的写法。
// #!/usr/bin/env node 或者 #!/usr/bin/node 是linux系统的写法。

const shell = require('shelljs');
const path = require('path');
const { exit } = require('process');

// 拷贝模板到脚本运行路径
// path.join(__dirname, 'template/*') 脚本存放路径
// . 脚本运行路径
let res = shell.cp('-R',  path.join(__dirname, 'template/*'), '.');

if (res.code === 1) {
    exit(1);
}

console.log('create successfully.');

const frontendProjectPath = 'projectname-frontend';
const backendProjectPath = 'projectname-backend';

// 安装依赖
// 安装依赖需要npm
if (!shell.which('npm')) {
    shell.echo('Sorry, this script requires npm.');
    shell.exit(1);
}

res = shell.cd(frontendProjectPath);

if (res.code === 1) {
    exit(1);
}
console.log('Start to install the frontend package.');
res = shell.exec('start npm install', {async: true});
res = shell.cd('..');
res = shell.cd(backendProjectPath);
console.log('Start to install the backend package.');
if (res.code === 1) {
    exit(1);
}
res = shell.exec('start npm install', {async: true});
// console.log(res);


