const { bot, mcg, lang } = require('../lib/')

bot(
  {
    pattern: 'mcg ?(.*)',
    desc: lang.plugins.mcg.desc,
    type: 'game',
  },
  async (message, match) => {
    if (!match) return message.send(lang.plugins.mcg.usage)

    if (['start', 'easy', 'hard'].includes(match)) {
      return mcg.start_game(
        message.jid,
        message.participant,
        'math_chain',
        message.id,
        match === 'start' ? 'easy' : match,
        message
      )
    }

    if (match === 'end') {
      return mcg.end(message.jid, message)
    }
  }
)
