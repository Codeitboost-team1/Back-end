<!-- Please do not edit this file. Edit the `blah` field in the `package.json` instead. If in doubt, open an issue. -->


















# w-json

 [![Support me on Patreon][badge_patreon]][patreon] [![Buy me a book][badge_amazon]][amazon] [![PayPal][badge_paypal_donate]][paypal-donations] [![Ask me anything](https://img.shields.io/badge/ask%20me-anything-1abc9c.svg)](https://github.com/IonicaBizau/ama) [![Version](https://img.shields.io/npm/v/w-json.svg)](https://www.npmjs.com/package/w-json) [![Downloads](https://img.shields.io/npm/dt/w-json.svg)](https://www.npmjs.com/package/w-json) [![Get help on Codementor](https://cdn.codementor.io/badges/get_help_github.svg)](https://www.codementor.io/johnnyb?utm_source=github&utm_medium=button&utm_term=johnnyb&utm_campaign=github)

<a href="https://www.buymeacoffee.com/H96WwChMy" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png" alt="Buy Me A Coffee"></a>







> A small module to write JSON files.






If you want to read JSON files, check out [`r-json`](https://github.com/IonicaBizau/node-r-json).












## :cloud: Installation

```sh
# Using npm
npm install --save w-json

# Using yarn
yarn add w-json
```













## :clipboard: Example



```js
// Dependencies
var WriteJson = require("w-json");

// Write the same file synchronously
WriteJson(__dirname + "/test.json", { "hello": "mars" });

// 4 space indent and new line at the end
WriteJson(__dirname + "/test.json", { "hello": "mars" }, {
    new_line: true
  , space: 4
});

// Write test.json asynchronously
WriteJson(__dirname + "/test.json", { "hello": "world" }, function (err, data) {
    console.log(err || "written");
});
```











## :question: Get Help

There are few ways to get help:



 1. Please [post questions on Stack Overflow](https://stackoverflow.com/questions/ask). You can open issues with questions, as long you add a link to your Stack Overflow question.
 2. For bug reports and feature requests, open issues. :bug:
 3. For direct and quick help, you can [use Codementor](https://www.codementor.io/johnnyb). :rocket:





## :memo: Documentation


### `wJson(path, data, options, callback)`
Writes a JSON file.

#### Params

- **String** `path`: The JSON file path.
- **Object** `data`: The JSON data to write in the provided file.
- **Object|Number|Boolean** `options`: An object containing the fields below. If boolean, it will be handled as `new_line`, if number it will be handled as `space`.

 - `space` (Number): An optional space value for beautifying the json output (default: `2`).
 - `new_line` (Boolean): If `true`, a new line character will be added at the end of the stringified content.
- **Function** `callback`: An optional callback. If not passed, the function will run in sync mode.














## :yum: How to contribute
Have an idea? Found a bug? See [how to contribute][contributing].


## :sparkling_heart: Support my projects
I open-source almost everything I can, and I try to reply to everyone needing help using these projects. Obviously,
this takes time. You can integrate and use these projects in your applications *for free*! You can even change the source code and redistribute (even resell it).

However, if you get some profit from this or just want to encourage me to continue creating stuff, there are few ways you can do it:


 - Starring and sharing the projects you like :rocket:
 - [![Buy me a book][badge_amazon]][amazon]—I love books! I will remember you after years if you buy me one. :grin: :book:
 - [![PayPal][badge_paypal]][paypal-donations]—You can make one-time donations via PayPal. I'll probably buy a ~~coffee~~ tea. :tea:
 - [![Support me on Patreon][badge_patreon]][patreon]—Set up a recurring monthly donation and you will get interesting news about what I'm doing (things that I don't share with everyone).
 - **Bitcoin**—You can send me bitcoins at this address (or scanning the code below): `1P9BRsmazNQcuyTxEqveUsnf5CERdq35V6`

    ![](https://i.imgur.com/z6OQI95.png)


Thanks! :heart:
















## :dizzy: Where is this library used?
If you are using this library in one of your projects, add it in this list. :sparkles:

 - `edit-json-file`
 - `bloggify`
 - `w-package-json`
 - `bloggify-cli`
 - `git-stats`
 - `engine-parser`
 - `engine-tools`
 - `engine-composition-crud`
 - `packy`
 - `web-term`
 - `blah`
 - `babel-it`
 - `made-in-romania`
 - `bible`
 - `auto-geo-sunset`
 - `engine-app`
 - `tithe`
 - `cdnjs-importer`
 - `ship-release`
 - `birthday`
 - `cli-sunset`
 - `idea`
 - `made-in-india`
 - `machine-ip`
 - `made-in-brazil`











## :scroll: License

[MIT][license] © [Ionică Bizău][website]






[license]: /LICENSE
[website]: https://ionicabizau.net
[contributing]: /CONTRIBUTING.md
[docs]: /DOCUMENTATION.md
[badge_patreon]: https://ionicabizau.github.io/badges/patreon.svg
[badge_amazon]: https://ionicabizau.github.io/badges/amazon.svg
[badge_paypal]: https://ionicabizau.github.io/badges/paypal.svg
[badge_paypal_donate]: https://ionicabizau.github.io/badges/paypal_donate.svg
[patreon]: https://www.patreon.com/ionicabizau
[amazon]: http://amzn.eu/hRo9sIZ
[paypal-donations]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=RVXDDLKKLQRJW