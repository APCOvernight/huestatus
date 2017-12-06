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
   * Order of logLevel inheritance
   * @return {Array}
   */
  static get logLevels () {
    return ['error', 'info', 'debug']
  }

  /**
   * Should message be logged?
   * @param  {String} logLevel    Level of message
   * @param  {String} configLevel Configured log level threshold
   * @return {Boolean}
   */
  _shouldLog (logLevel, configLevel) {
    return BaseClass.logLevels.indexOf(logLevel) <= BaseClass.logLevels.indexOf(configLevel)
  }

  /**
   * Log an info message
   * @param  {String} message      Message to log
   * @param  {String} status       Status updated to
   * @param  {String} instanceName Instance that updated status
   */
  info (message, status, instanceName) {
    this.log('info', message, status, instanceName)
  }

  /**
   * Log a debug message
   * @param  {String} message      Message to log
   * @param  {String} status       Status updated to
   * @param  {String} instanceName Instance that updated status
   */
  debug (message, status, instanceName) {
    this.log('debug', message, status, instanceName)
  }

  /**
   * Log an error
   * @param  {String} message      Message to log
   */
  error (message) {
    this.log('error', message)
  }

  /**
   * Log a message to console if debug mode is turned on
   * @param  {String} level        Log level - debug, info or error
   * @param  {String} message      Message to be logged
   * @param  {String} status       The status to update it to
   * @param  {String} instanceName
   */
  log (level, message, status, instanceName) {
    this._logToReporters(level, message, status, instanceName)
  }

  /**
   * Send log to all registered reporters, depending on log level
   * @param  {String} level        Log level - debug, info or error
   * @param  {String} message      Message to be logged
   * @param  {String} status       The status to update it to
   * @param  {String} instanceName
   */
  _logToReporters (level, message, status, instanceName) {
    if (this.reporters) {
      this.reporters.map(reporter => {
        if (this._shouldLog(level, reporter.config.logLevel)) {
          reporter.log(level, status, `${instanceName ? instanceName + ' - ' : ''}${message}`)
        }
      })
    }
  }
}

module.exports = BaseClass
