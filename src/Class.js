'use strict'

/**
 * Methods to be shared by all classes
 */
class BaseClass {
  /**
   * @param  {Object} config Configuration
   */
  constructor (config) {
    this.config = config
  }

  /**
   * Log a message to console if debug mode is turned on
   * @param  {Mixed} message
   */
  log (...message) {
    if (this.config.debug) {
      console.info(...message)
    }
  }
}

module.exports = BaseClass
