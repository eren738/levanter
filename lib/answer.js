const { bot, mcg } = require('../lib/')

bot(
  {
    on: 'text',
    type: 'game',
  },
  async (message) => {
    // Ignore commands
    if (message.text.startsWith('.')) return

    mcg.handle_answer(message, message.text.trim())
  }
)
