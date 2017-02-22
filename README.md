# Red todo Boilerplate

This starter kit was made to help to develop a react project 

It helps:

* to transpile with Babel ES6 code
* to bundle with Wbepack JS files and hot reload client's code
* to write tests and check code coverage. 

### Install

Install [node](https://nodejs.org/en/) first. After that:

```
$ npm install -g yarn install
$ yarn install
```

Edit `config/default.js` for your needs.


### Development Mode

#### Launch Client

```
$ yarn build:dev
yarn build:dev 
$ NODE_ENV=development webpack-dev-server --progress --config webpack.config.js 

Project is running at http://0.0.0.0:3000/
webpack output is served from /assets/
Content not from webpack is served from ./public
404s will fallback to /index.html

webpack: bundle is now VALID.
```


Point your browser to `http://0.0.0.0:3000/` it will load client side application. 

You should see `Hello World, this is my first react app!`, open your console and check you have :

```
[HMR] Waiting for update signal from WDS...
mounting react app ...
[WDS] Hot Module Replacement enabled.
```


As you can guess we are using webpack `hot reload` module, try to update any file under `src/client` and your browser should reload your code.

```
[WDS] App updated. Recompiling...
```


#### Test

Test, test and re-test …

```
$ yarn test
```

Tests are installed under `test` folder.

#### fake.js

A simple template to implement simple unit tests. In todo context you will try to test every functions or classes from client code. Just import your files and check (http://shouldjs.github.io/)[should] documentation to extend the test.

#### Coverage

```
yarn coverage

> todoboilerplate@0.0.1 coverage /home/eric/JS/todo_boilerplate
> NODE_ENV=test nyc -r lcov -r text mocha --require babel-core/register

```

Check results …. of this command, and launch your browser to `./coverage/lcov-report/index.html`

That’s all folks ... 
