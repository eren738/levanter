const { bot, mcg } = require('../lib/')

bot(
  {
    pattern: '^join$',
    type: 'game',
  },
  async (message) => {
    mcg.join(message.jid, message.participant, message)
  }
)
