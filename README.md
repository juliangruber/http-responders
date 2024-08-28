# http-responders

Zero-dependency HTTP response functions.

Supports:

- `status`
- `json`
- `redirect`
- `stream`
- `file`
- `download`

## Example

```js
import { status, json, redirect, stream, file, download } from 'http-responders'

http.createServer(async (req, res) => {

  // Respond with HTTP Status
  status(res, 404)

  // Respond with JSON
  json(res, { beep: 'boop' })

  // Redirect
  redirect(req, res, 'https://example.com/')

  // Respond with a generic stream
  await stream(res, fs.createReadStream('file.txt'))

  // Respond with a file (+ content length)
  await file(res, 'file.txt')

  // Make the browser download the file
  await download(res, 'file.txt)

})
```

## Installation

```bash
$ npm install http-responders
```

## API

### .status(res, code)

### .json(res, json)

### .redirect(req, res, location)

### await .stream(res, stream)

### await .file(res, path, [fsOpts])

### await .download(res, path, [fsOpts])

## License

MIT
