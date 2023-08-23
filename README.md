# infinitered CLI

A CLI for [Infinite Red](https://infinite.red), with functionality we use internally.

## Commands

### `npx infinitered transcribe <filename>`

Alias: `t`

Transcribes the given audio file and writes the transcription to a text file with the same name.

This uses OpenAI's `whisper-1` model.

We primarily use this for transcribing [React Native Radio's podcast episodes](https://reactnativeradio.com).

#### Options:

- `--format`: The response format you want the transcription in (default is 'json').
- `--prompt`: An optional prompt to include in the transcription request.

#### Environment:

- `OPENAI_API_KEY`: You must set this environment variable with your OpenAI API key.

#### Example Usage:

The filename is required. All --options are optional.

```bash
# can also be set in .zshrc file or similar
# windows powershell is $env:OPENAI_API_KEY = 'yourkeyhere'
export OPENAI_API_KEY=yourkeyhere
# transcribe a file
npx infinitered transcribe myfile.mp3 --format=json --prompt="Optional prompt" --output=mytranscription.txt
```

Make sure you have set the `OPENAI_API_KEY` in your environment before running the command.

## Working on the CLI

Clone it down:

```shell
git clone git@github.com:infinitered/infinitered-cli.git
```

Install dependencies:

```shell
cd infinitered-cli
yarn
```

Link the CLI:

```shell
yarn link
```

Now you can run the CLI from anywhere:

```shell
ir transcribe <filename>
# or
infinitered transcribe <filename>
```

infinitered-cli is powered by Gluegun. See Gluegun's [docs](https://infinitered.github.io/gluegun) for more information on how to use it.

## Publishing to NPM

To package your CLI up for NPM, do this:

```shell
$ yarn login
$ yarn whoami
$ yarn test

$ yarn build

$ yarn publish
```

# License

MIT - see LICENSE
