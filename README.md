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
const { json } = require('http-responders')

http.createServer((req, res) => {
  json(res, { beep: 'boop' })
})
```

## Installation

```bash
$ npm install http-responders
```

## API

### .json(res, json)
### .redirect(req, res, location)
### .stream(res, stream)
### .file(res, path, [fsOpts])
### .download(res, path, [fsOpts])

## Kudos

Development of this module is sponsored by:

![Liberate Science](https://libscie.org/assets/images/image01.png?v33093812210851)

## License

MIT