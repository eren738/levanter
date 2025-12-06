const { bot } = require('../lib/')

const games = new Map() // Active games by chatId

// Difficulty ranges
const difficultyRanges = {
  easy: { min: 1, max: 20 },
  medium: { min: 10, max: 100 },
  hard: { min: 50, max: 500 },
}

// Generate a random math question
function generateQuestion(difficulty) {
  const range = difficultyRanges[difficulty]
  let a = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
  let b = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
  const ops = ['+', '-', '*', '/']
  const op = ops[Math.floor(Math.random() * ops.length)]

  let question = `${a} ${op} ${b}`
  let answer = 0

  switch (op) {
    case '+': answer = a + b; break
    case '-': answer = a - b; break
    case '*': answer = a * b; break
    case '/': 
      answer = a
      question = `${a * b} / ${b}` // Ensure integer division
      break
  }

  return { question, answer }
}

// Helper to send messages
function send(ctx, text) {
  if (ctx.reply) return ctx.reply(text)
  if (ctx.send) return ctx.send(text)
  if (ctx.channel?.send) return ctx.channel.send(text)
}

// Move to the next player's turn
function nextTurn(chatId, ctx) {
  const game = games.get(chatId)
  if (!game) return

  game.currentPlayer++
  if (game.currentPlayer > game.players) game.currentPlayer = 1

  const q = generateQuestion(game.difficulty)
  game.question = q.question
  game.answer = q.answer

  send(ctx,
    `👉 **Player ${game.currentPlayer}**, your turn!\n` +
    `**${game.question} = ?** (you have ${game.timeLimit}s)`
  )

  // Start timer
  game.timer = setTimeout(() => {
    send(ctx, `⏳ **Time's up!** Player ${game.currentPlayer} missed their turn.`)
    nextTurn(chatId, ctx)
  }, game.timeLimit * 1000)
}

// Register the bot command
bot(
  {
    pattern: 'Maths. ?(.*)',
    desc: 'Maths game\nMaths. start <difficulty> <players> <time> to start the game\nMaths. end to end the game',
    type: 'game',
  },
  async (message, match) => {
    const chatId = message.jid
    const input = match.trim().toLowerCase().split(' ')

    // ===== Start Game =====
    if (input[0] === 'start') {
      const difficulty = input[1] || 'easy'
      const players = parseInt(input[2]) || 2
      const timeLimit = parseInt(input[3]) || 15

      // Validation
      if (!['easy', 'medium', 'hard'].includes(difficulty))
        return send(message, '❌ Invalid difficulty. Use easy, medium, or hard.')
      if (isNaN(players) || players < 2 || players > 6)
        return send(message, '❌ Number of players must be between 2–6.')
      if (isNaN(timeLimit) || timeLimit < 5 || timeLimit > 60)
        return send(message, '❌ Time limit must be between 5 and 60 seconds.')

      const q = generateQuestion(difficulty)

      games.set(chatId, {
        difficulty,
        players,
        currentPlayer: 1,
        question: q.question,
        answer: q.answer,
        timeLimit,
        scores: Array(players).fill(0),
        timer: null
      })

      send(message,
        `🎮 **Maths Game Started!**\n` +
        `Difficulty: **${difficulty}**\n` +
        `Players: **${players}**\n` +
        `Time per question: **${timeLimit}s**\n\n` +
        `👉 **Player 1**, your question:\n` +
        `**${q.question} = ?** (you have ${timeLimit}s)`
      )

      nextTurn(chatId, message)
      return
    }

    // ===== End Game =====
    if (input[0] === 'end') {
      const game = games.get(chatId)
      if (!game) return send(message, '❌ No active maths game.')

      if (game.timer) clearTimeout(game.timer)

      let result = '🏁 **Game Over! Final Scores:**\n\n'
      let bestScore = -1
      let winner = 1

      game.scores.forEach((s, i) => {
        result += `Player ${i + 1}: **${s}** points\n`
        if (s > bestScore) { bestScore = s; winner = i + 1 }
      })

      result += `\n👑 **Winner: Player ${winner}!**`
      send(message, result)

      games.delete(chatId)
      return
    }

    // ===== Handle Player Answer =====
    const game = games.get(chatId)
    if (!game) return send(message, '❌ No active maths game. Start with Maths. start <difficulty> <players> <time>')

    const playerAnswer = parseFloat(input[0])
    if (isNaN(playerAnswer)) return send(message, '❌ Please provide a valid number as your answer.')

    if (game.timer) clearTimeout(game.timer)

    if (playerAnswer === game.answer) {
      game.scores[game.currentPlayer - 1]++
      send(message, `✅ Correct! Player ${game.currentPlayer} now has **${game.scores[game.currentPlayer - 1]}** points.`)
    } else {
      send(message, `❌ Wrong! The correct answer was **${game.answer}**.`)
    }

    nextTurn(chatId, message)
  }
)
