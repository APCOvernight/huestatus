'use strict'

/**
 * HueStatus reporter that logs to console
 */
class ConsoleReporter {
  /**
   * Called to fire up reporter
   */
  async start () {
    this.started = true
  }

  /**
   * Log message to console
   * @param  {String} level   logLevel
   * @param  {String} status  Status of logged message
   * @param  {String} message Message to display in logs
   */
  log (level, status, message) {
    console.info(message)
  }
}

module.exports = ConsoleReporter
