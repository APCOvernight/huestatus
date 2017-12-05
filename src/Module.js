'use strict'

const uuidv4 = require('uuid/v4')

/**
 * Base class for huestatus modules. Modules must extend this class
 */
class BaseModule {
  /**
   * @param  {Object} config  Module config options
   * @param  {EventEmitter} emitter Event emitter listening for 'change' events
   */
  constructor (config, emitter) {
    this.config = config
    this.emitter = emitter
    this.instanceName = this.generateInstanceName()
  }

  /**
   * Instance name generator. Can be overridden by modules, should create unique name
   * @return {String} Uuid
   */
  generateInstanceName () {
    return `${this.config.name}-${uuidv4()}`
  }

  /**
   * Change the status of the lamp by emitting event. This should not
   * be overridden by individual modules
   * @param  {String}  status  The status
   * @param  {String}  message Message to log to
   * @return {Promise}
   */
  async change (status, message) {
    await this.emitter.emit('change', this.instanceName, status, message)
  }

  /**
   * Start listening process. Must be overridden by individual modules or error will throw
   * @throws No start method defined
   */
  async start () {
    throw new Error(`No start method defined on ${this.instanceName} module`)
  }
}

module.exports = BaseModule
