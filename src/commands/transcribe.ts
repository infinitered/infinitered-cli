import { GluegunToolbox } from 'gluegun'
import OpenAI from 'openai'

module.exports = {
  name: 'transcribe',
  alias: ['t'],
  description: `Transcribe an audio file using OpenAI's whisper-1 model.`,
  run: async (toolbox: GluegunToolbox) => {
    const { parameters, print, filesystem } = toolbox
    const { info, spin } = print

    if (!process.env.OPENAI_API_KEY) {
      info('Please set OPENAI_API_KEY in your environment and try again')
      info('export OPENAI_API_KEY=yourkey')
      return
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const filename = parameters.first

    if (!filename) {
      info('Please specify an audio file to transcribe')
      info('npx infinitered transcribe <filename>')
      return
    }

    if (!(await filesystem.existsAsync(filename))) {
      info(`File ${filename} does not exist`)
      return
    }

    const fileStream = filesystem.createReadStream(filename)

    // Transcribe the audio
    const s = spin('Transcribing audio')
    const response: OpenAI.Audio.Transcriptions.Transcription =
      await openai.audio.transcriptions.create({
        model: 'whisper-1',
        file: fileStream,
        response_format: parameters.options.format || 'json',
        prompt: parameters.options.prompt || '',
      })
    s.succeed('Transcription complete')

    s.text = 'Writing transcription to file'
    s.start()

    // Write it to a text file of the same name (or custom if specified)
    const outputFilename =
      parameters.options.output || filename.replace(/\.[^/.]+$/, '.txt')
    await filesystem.writeAsync(outputFilename, response.text)

    s.succeed('Transcription written to file: ' + outputFilename)

    info('\n\n')
  },
}
