#!/usr/bin/env node

'use strict'

const Hue = require('./src/Hue')

const startHue = async () => {
  // Load config from file
  const config = require('rc')('hue', require('./lib/default-config'))
  const hue = new Hue(config)

  await hue.init()
  await hue.start()
}

module.exports = startHue()
