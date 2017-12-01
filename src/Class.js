'use strict'

class BaseClass {
  constructor (config) {
    this.config = config
  }

  log (...message) {
    if (this.config.debug) {
      console.info(...message)
    }
  }
}

module.exports = BaseClass
