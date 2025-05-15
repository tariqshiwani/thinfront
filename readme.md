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

### Installation

1. Include jQuery in your project:

   ```html
   <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
   ```

2. Include Thinfront in your project:
   ```html
   <script src="https://cdn.jsdelivr.net/gh/tariqshiwani/thinfront@master/src/tf.js"></script>
   ```

### Basic Usage

Here's a simple example to get started with Thinfront:

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

## Documentation

For detailed documentation and examples, please refer to the [official Thinfront documentation](#).

## Contributing

We welcome contributions! Feel free to submit issues or pull requests to help improve Thinfront.

## License

Thinfront is licensed under the [MIT License](LICENSE).

---

Start building your next frontend application with Thinfront today!
