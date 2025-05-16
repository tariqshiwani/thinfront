# Thinfront

Thinfront is a lightweight frontend framework designed to simplify the creation of Single Page Applications (SPA). Built on top of jQuery, Thinfront provides a robust yet simple solution for developing modern frontend applications with minimal complexity.

## Key Features

- **HTML Views**: Serve dynamic HTML views effortlessly.
- **Shared Views**: Reuse components across your application.
- **Multiple Layouts**: Support for multiple layouts to structure your application.
- **URL Rewrite**: Seamless URL rewriting for clean and user-friendly URLs.
- **Two-Way Binding**: On-demand two-way data binding for dynamic interactions.
- **Plugin Support**: Use any jQuery or vanilla JavaScript-based plugins.
- **Debug-Friendly**: No complex code or TypeScript, making debugging straightforward.
- **Quick Development**: Packed with features to accelerate frontend development.

## Why Thinfront?

Thinfront is perfect for developers who want a simple yet powerful framework without the overhead of modern complex tools. Its jQuery foundation ensures compatibility with a wide range of plugins and libraries, making it highly extensible and versatile.

## Getting Started

### Prerequisites

- **jQuery**: Thinfront requires jQuery to function. You can include any version of jQuery in your project.

## Installation

### Manual Install

1. Include jQuery in your project:

   ```html
   <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
   ```

2. Include Thinfront in your project:
   ```html
   <script src="https://cdn.jsdelivr.net/gh/tariqshiwani/thinfront@master/src/tf.js"></script>
   ```

### npm install

1. Install using following command in terminal
   ```html
   npm install thinfront
   ```

2A. Include Thinfront in your project:

   ```html
   <script src="node_modeuls/thinfront/dist/tf.min.js"></script>
   ```
2B. if you are using expressjs you need to add following script in your application.js file

```javascript
app.use('/assets', [
    express.static(__dirname + '/node_modules/thinfront/dist/'),
    ...
]);
```


### Basic Usage

Here's a simple example to get started with Thinfront:

#### Folder structure

```html
  [+] Root Folder
   |-> settings.json
   |-> url_rewrite.json
   |-> index.html
   |-> [+] layouts
   |    |-> layout.html
   |-> [+] scripts
   |    |-> app.js
   |-> [+] styles
   |    |-> style.css
   |-> [+] views
        |-> home.html
```

#### settings.json

```json
{
    "layouts": {
        "login": "login.html",
        "home": "main.html"
    },
    "home": "home",
    "viewFolder": "views",
    "allowBrowserCache": false,
    "serviceUrl": "https://myapiurl",
    "applicationTitle": "ThinFront Application"
}
```

#### Understanding settings.json

- **layouts** property is where you can define multiple layouts to be used with your views, you can later refer to any of these layouts in your views, when navigated to that view it will automatically load the specified layout
- **home** is where you define your first landing page, the value should be the name of the html file without the extension.
- **viewFolder** is the property where you define which folder contains all the views, default folder name is always set to views but you can change it to serve your views from different folders.
- **allowBrowserCache** when set to true, the framework will start caching the views as they are loaded and will be served from browser's cache next time.
- **applicationTitle** is where you define the application title, which is shown all the time in page title along with the title from the view separated by "-"

settings.json file is a required file and without it the framework will not function properly.

#### index.html

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title></title>
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, user-scalable=no" />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
      integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
      crossorigin="anonymous"
    />
    <title>Thinfront Demo</title>
  </head>
  <body>
    <div id="__app_layout"></div>

    <div id="__app_scripts">
      <script
        src="https://code.jquery.com/jquery-3.7.1.min.js"
        integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo="
        crossorigin="anonymous"
      ></script>
      <script src="https://cdn.jsdelivr.net/gh/tariqshiwani/thinfront@master/src/tf.js"></script>

      <script src="scripts/app.js"></script>

      <div id="__layout_scripts"></div>
      <div id="__view_scripts"></div>
    </div>
  </body>
</html>
```

#### Understanding the index.html

- this page is an entry point of the application and a required file.
- the div with Id \_\_app_layout is where the layout of the page will be loaded.
- the element with Id \_\_layout_scripts is where the scripts from the layout page will be loaded.
- \_\_view_scripts element contains the view level scripts.

any scripts defined the scripts tags defined in views or layout pages are moved to their respective sections defined above on the fly, and when the view or layout is changed those scripts are unloaded.

#### layout.html

```html
<div include-html="_shared/header.html"></div>
<div class="page-container">
  <div include-html="_shared/sidenav.html" class="side-nav" id="sidenav"></div>
  <div class="content-area" id="content">
    <div class="content-flex">
      <div container="view"></div>
    </div>
    <div class="footer-bar">
      Powered by
      <a target="_blank" href="http://thinfront.org/">Thinfront</a>
    </div>
  </div>
</div>
```

#### Understanding the layout.html

- include-html attribute includes the shared view (html file) under the element, this works on both the view and the layout.
- container="view" attribute is the element where your views will be loaded.

#### views

```html
<div app-layout="home" app-title="Home">
  <!-- here you provide the layout name which is defined in settings.json -->
  <link href="views/home/dashboard.css" rel="stylesheet" />
  <div page-state="dashboard">
    <!-- your html goes here-->
  </div>
</div>
<script src="views/home/dashboard.js"></script>
```

#### Understanding view

- **app-layout** is the attribute where you define the layout page, when this view is loaded the framework automatically loads the layout page specified, if there is any other view already loaded it will be unloaded first.
- the script section defined here will automatically be moved to **\_\_view_scripts** element defined in the index.html
- the url of your application contains # anything after this sign refers to the folder structure under the **views** folder, you can have multiple folders under views folder and multiple html files under them, the default page for each folder is index.html.

**the URLs for the folder will be as follows**

- /views/home/index.html -> #/home
- /views/home/dashboard.html -> #/home/dashboard
- /views/orders/index.html -> #/orders
- /views/orders/create.html -> #/orders/create

please make sure to include "#" before all the URLs defined in the href attribute on anchor tag i.e. "#home" or "#orders/list"

### and finally the app.js

this file initializes the thinfront framework.

#### app.js

```javascript

  $(document).ready(function () {
    tf.init();
    if (typeof window.tf !== "undefined") {
      window.tf.events = (function () {
        return {
          beforeLayoutRender: function (layout) {
            console.log("loading layout ", layout);
          },
          afterLayoutRender: function (layout) {
            console.log("loaded layout", layout);
          },
          beforeViewRender: function (view) {
            console.log("loading view ", view);
          },
          afterViewRender: function (view) {
            console.log("loaded view ", view);
          },
          pagePermission: function (urlObj, allowed) {
            if (!allowed) {
              console.log(
                "you do not have permission to access this resource",
                "cs-danger"
              );
            }
          },
          servicePermission: function (url, allowed, source) {
            if (!allowed) {
              console.log(
                "you do not have permission to access this resource",
                "cs-danger"
              );
            }
          },
          notLoggedIn: function () {
            console.log("not logged in");
          },
          tokenExpired: function () {
            console.log("token has expired");
          },
        };
      })();
    }
  });

```

#### Understanding the app.js

- it adds tf object under the window object which can be refered as window.tf and contains all the additional functionality of the framework, i.e. current page object, user object (if logged in) etc.
- under the events property there is an event object defined which lets you run your own code on different events, these are global events and will be triggered automatically when those events occur.

## Documentation

For detailed documentation and examples, please refer to the [official Thinfront documentation](http://thinfront.org).

## Contributing

We welcome contributions! Feel free to submit issues or pull requests to help improve Thinfront.

## License

Thinfront is licensed under the [MIT License](LICENSE).

---

Start building your next frontend application with Thinfront today!
