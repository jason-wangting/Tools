const path = require('path');
module.exports = {
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.ts/,
                use: 'ts-loader',
                exclude: /node-modules/
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    }
}