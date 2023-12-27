# <img src="https://github.com/Cutwell/hands-on-python/blob/main/logo-64x64.svg" style="width:64px;padding-right:20px;margin-bottom:-8px;"> Hands-on Python
 Learn Python fundamentals collaboratively, using inter-connected web devices

<!-- Find new badges at https://shields.io/badges -->
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Run locally

### Install dependencies

```sh
poetry install
```

### Usage

1. Start the Python server:

```sh
cd server
poetry run uvicorn main:app --reload
```

2. Open the webpage across multiple devices / tabs and join the same room.
3. Compose a line of code. Empty lines are ignored - so not every line of code must use all connected devices!
4. Once ready, execute your code by pressing "Run Code". This executes as real Python code on the server!
5. Press "Show Terminal" to view outputs. Each time you run some code, the finished line of code plus the output (either the resulting variables, or an error if something goes wrong) are logged to the terminal. Maybe use one device as a terminal screen whilst you compose Python snippets with your other screens?

## Contributing

<!-- Remember to update the links in the `.github/CONTRIBUTING.md` file from `Cutwell/hands-on-python` to your own username and repository. -->

For information on how to set up your dev environment and contribute, see [here](.github/CONTRIBUTING.md).

## License

MIT

## Attribution
- [Room Code Input](https://codepen.io/apokusin/pen/njaZmW) ([Artur Pokusin](https://codepen.io/apokusin))
- [CSS Terminal](https://codepen.io/addyosmani/pen/avxmvN) ([Addy](https://codepen.io/addyo))
