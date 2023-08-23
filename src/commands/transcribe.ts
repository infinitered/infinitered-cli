import { GluegunToolbox } from 'gluegun'
import { globSync } from 'glob'

import OpenAI from 'openai'

// Merge multiple segment objects based on "start" parameter.
// If a person speaks twice in a row, merge them into one.
// If a segment "no_speech_prob" is greater than threshold, do not use it.
const no_speech_threshold = 0.7
function mergeAndSortSegments(jsonObjects) {
  // Extract all segments from the JSON objects and flatten the array
  let allSegments = []
  jsonObjects.forEach((obj, index) => {
    obj.segments.forEach((segment) => {
      if (segment.no_speech_prob <= no_speech_threshold) {
        // @ts-ignore - TODO: Type issue - Solve later
        allSegments.push({ ...segment, origin: index })
      }
    })
  })

  // Sort the segments by the 'start' property
  // @ts-ignore - TODO: Type issue - Solve later
  allSegments.sort((a, b) => a.start - b.start)

  // Merge adjacent segments
  const mergedSegments = []
  let currentSegment = null
  for (const segment of allSegments) {
    if (!currentSegment) {
      currentSegment = segment
      // @ts-ignore - TODO: Type issue - Solve later
    } else if (currentSegment.origin === segment.origin) {
      // Kill stutters
      // @ts-ignore - TODO: Type issue - Solve later
      if (currentSegment.text !== segment.text) {
        // @ts-ignore - TODO: Type issue - Solve later
        currentSegment.text += ' ' + segment.text
      }
    } else {
      mergedSegments.push(currentSegment)
      currentSegment = segment
    }
  }
  if (currentSegment) {
    mergedSegments.push(currentSegment)
  }

  return { segments: mergedSegments }
}

module.exports = {
  name: 'transcribe',
  alias: ['t'],
  description: `Transcribe an audio file using OpenAI's whisper-1 model.`,
  run: async (toolbox: GluegunToolbox) => {
    const { parameters, print, filesystem } = toolbox
    const { info, spin } = print

    if (!process.env.OPENAI_API_KEY) {
      info('Please set OPENAI_API_KEY in your environment and try again')
      if (process.platform === 'win32') {
        info("$env:OPENAI_API_KEY = 'yourkeyhere'")
      } else {
        info('export OPENAI_API_KEY=yourkey')
      }
      return
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const filename = parameters.first

    if (!filename) {
      info('Please specify an audio file prefix to transcribe')
      info('npx infinitered transcribe <file-prefix>')
      info('E.g.')
      info('npx infinitered transcribe rnr273')
      return
    }

    const mp3Files = globSync(filename + '*.mp3', { nodir: true })
    info('MP3 files found: ' + mp3Files.length)

    if (mp3Files.length === 0) {
      info(`Prefix '${filename}' does have any results`)
      return
    }

    // Generate questions
    const questions = []
    for (let x = 0; x < mp3Files.length; x++) {
      //const file = mp3Files[x].toString()
      const askName = {
        type: 'input',
        name: questions.length.toString(),
        message:
          'Please name the speaker in this file:' + mp3Files[x].toString(),
      }
      // @ts-ignore - TODO: Type issue - solve later
      questions.push(askName)
    }

    // @ts-ignore - TODO: Type issue - solve later
    const theNames = await toolbox.prompt.ask(questions)
    console.log(theNames)

    // Check if files are larger than 25megs (warn user)
    // TODO: check

    let transcribeCount = 0
    for (const file of mp3Files) {
      transcribeCount++
      const fileStream = filesystem.createReadStream(file)

      // Transcribe the audio

      const s = spin(
        `Transcribing Audio File ${transcribeCount} out of ${mp3Files.length}`
      )
      const response: OpenAI.Audio.Transcriptions.Transcription =
        await openai.audio.transcriptions.create({
          model: 'whisper-1',
          file: fileStream,
          response_format: parameters.options.format || 'verbose_json',
          prompt:
            parameters.options.prompt ||
            'React Native Radio, Jamon, Holmgren, Robin, Heinze, Mazen, Chami, Sanket Sahu',
          language: 'en', // improves quality of transcription
        })
      s.succeed(
        `API Transcription complete: File ${transcribeCount} out of ${mp3Files.length}`
      )

      s.text = 'Writing transcription to file'
      s.start()

      // Write it to a json file of the same name
      const outputFilename = file.replace(/\.[^/.]+$/, '.json')
      await filesystem.writeAsync(outputFilename, JSON.stringify(response))

      s.succeed('Transcription written to file: ' + outputFilename)
    }

    const s = spin('Reading transcriptions and merging')

    const jsonFiles = globSync(filename + '*.json', { nodir: true })

    const allJsonFiles = []
    for (const jsonFile of jsonFiles) {
      if (jsonFile && typeof jsonFile === 'string') {
        s.text = 'Reading transcription: ' + jsonFile
        // @ts-ignore - TODO: Type issue - solve later
        allJsonFiles.push(require(jsonFile))
      }
    }

    const mergeResult = mergeAndSortSegments(allJsonFiles)

    let fileContent = ''
    mergeResult.segments.forEach((segment) => {
      // @ts-ignore - TODO: Type issue - Solve later
      fileContent += `${theNames[segment.origin]}\n`
      // @ts-ignore - TODO: Type issue - Solve later
      fileContent += `Text: ${segment.text}\n\n`
    })
    s.text = 'Files merged and sorted'

    const finalFilename = parameters.options.output || 'final.txt'
    await filesystem.writeAsync(finalFilename, fileContent)

    s.succeed('Successfully Written transcript')

    info('\n\n')
  },
}
