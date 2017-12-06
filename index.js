#!/usr/bin/env node

'use strict'

const Hue = require('./src/Hue')

const startHue = async () => {
  // Load config from file
  try {
    const config = require('rc')('hue', require('./lib/default-config'))

    const hue = new Hue(config)

    await hue.init()
    await hue.start()
  } catch (e) {
    console.error('Error loading Config File')
    console.error(e.message)
    console.info('Add a .huerc config file - See https://www.npmjs.com/package/huestatus for more info')
    process.exit(1)
  }
}

module.exports = startHue()
