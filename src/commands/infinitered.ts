import { GluegunCommand } from 'gluegun'

const command: GluegunCommand = {
  name: 'infinitered',
  run: async (toolbox) => {
    const { print } = toolbox

    print.success(`Welcome to Infinite Red's internal CLI!\n`)
    print.printHelp(toolbox)
    print.success(`\nGithub: https://github.com/infinitered/infinitered-cli`)
  },
}

module.exports = command
