'use strict'

const axios = require('axios')
const crypto = require('crypto')

const secret = process.env.GH2TG_SECRET
const tgToken = process.env.GH2TG_TG_TOKEN
const tgChatId = process.env.GH2TG_TG_CHATID

const sendTelegramMessage = async text => {
  return axios.post(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
    chat_id: tgChatId,
    text: text,
    parse_mode: 'Markdown',
    disable_web_page_preview: true
  })
}

const verifyWebhook = (body, signature) => {
  if (body === '' || signature === '') return false
  const payload = JSON.stringify(body)
  const hmac = crypto.createHmac('sha1', secret)
  const digest = 'sha1=' + hmac.update(payload).digest('hex')
  return digest === signature
}

module.exports.push = async (event, context) => {
  const body = JSON.parse(event.body) || ''
  const signature = event.headers['X-Hub-Signature'] || ''
  const isValidRequest = verifyWebhook(body, signature)
  if (!isValidRequest) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: 'Invalid request'
      })
    }
  }
  if (body.commits) {
    const commits = body.commits || []
    const commitMsg = commits
      .map(commit => `*${commit.author.name}* - ${commit.message}`)
      .join('\n')
    const compareURL = body.compare ? `\n\n${body.compare}` : ''
    await sendTelegramMessage(`${commitMsg}${compareURL}`)
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Success'
      })
    }
  } else {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'No commits'
      })
    }
  }
}
