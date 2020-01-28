# http-responders

Zero-dependency HTTP response functions.

Supports:

- `json`
- `redirect`
- `stream`
- `file`
- `download`

## Example

```js
const { json, redirect, stream, file, download } = require('http-responders')

http.createServer((req, res) => {

  // Respond with JSON
  json(res, { beep: 'boop' })

  // Redirect
  redirect(req, res, 'https://example.com/')

  // Respond with a generic stream
  stream(res, fs.createReadStream('file.txt'))

  // Respond with a file (+ content length)
  file(res, 'file.txt')

  // Make the browser download the file
  download(res, 'file.txt)

})
```

## Installation

```bash
$ npm install http-responders
```

## API

### .json(res, json)

### .redirect(req, res, location)

### await .stream(res, stream)

### await .file(res, path, [fsOpts])

### await .download(res, path, [fsOpts])

## Kudos

Development of this module is sponsored by:

![Liberate Science](https://libscie.org/assets/images/image01.png?v33093812210851)

## License

MIT
