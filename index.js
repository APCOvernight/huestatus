'use strict'

const Hue = require('./src/Hue')

/**
 * Echo unhandledRejections nicely
 */
process.on('unhandledRejection', error => {
  console.error('Unhandled Promise Rejection', error.message)
})

const startHue = async () => {
  // Load config from file
  const config = require('rc')('hue', require('./lib/default-config'))
  const hue = new Hue(config)

  await hue.init()

  process.on('SIGINT', async () => {
    /**
     * Reset all lamps on process interruption
     */
    await hue.stop()
    process.exit()
  })

  // Start all listeners
  await hue.start()
}

module.exports = startHue()
