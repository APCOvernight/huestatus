'use strict'

const Hue = require('./src/Hue')

process.on('unhandledRejection', error => {
  console.error('Unhandled Promise Rejection', error.message)
})

process.on('uncaughtException', error => {
  console.error(error)
  process.exit()
})

const startHue = async () => {
  const config = require('rc')('hue', require('./lib/default-config'))
  const hue = new Hue(config)

  await hue.init()

  process.on('SIGINT', async () => {
    await hue.stop()
    process.exit()
  })

  await hue.start() // Start all listeners
}

module.exports = startHue()
