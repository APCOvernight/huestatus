'use strict'

const BaseClass = require('./Class')
const events = require('events')

/**
 * Class representing on hue bulb
 * @extends BaseClass
 */
class Lamp extends BaseClass {
  /**
   * @param  {Object} config Configuration
   * @param  {Object} light  HueJay Light instance
   * @param  {Object} lights HueJay Lights instance
   * @param  {Array.Object} reporters Reporter instances (so that Lamp  can
   *                                  fire the same reporters as Hue)
   */
  constructor (config, light, lights, reporters) {
    super(config)
    this.light = light
    this.lights = lights
    this.reporters = reporters
    this.name = light.name

    this.isDirty = false

    this.modules = {}

    this.eventEmitter = new events.EventEmitter()
    this.eventEmitter.on('change', this._updateModuleStatus.bind(this))

    this.initialState = this._getState()

    this.info(`  💡  ${this.name} is ${!this.light.reachable ? 'not ' : ''}reachable ${this.light.reachable ? '✅' : '⛔️'}`)
  }

  /**
   * Precedence of statuses
   * @type {Array.String}
   */
  static get statusPrecedence () {
    return ['alert', 'warning', 'working', 'ok']
  }

  /**
   * Get the current state of a hue light
   * @return {Object} State settings
   */
  _getState () {
    return {
      hue: this.light.hue,
      brightness: this.light.brightness,
      saturation: this.light.saturation,
      alert: this.light.alert
    }
  }

  /**
   * Register instance of a module against the lamp so status can be stored against it
   * @param  {String} instanceName
   */
  registerModuleInstance (instanceName) {
    if (this.modules[instanceName]) {
      throw new Error(`Module with instanceName of ${instanceName} already registered`)
    }

    this.modules[instanceName] = { status: null }
  }

  /**
   * Update the stored status for an instance and fire _updateStatus
   * @param  {String}  instanceName
   * @param  {String}  status       The status to update it to
   * @param  {String}  message      Message to be logged
   * @return {Promise}
   */
  async _updateModuleStatus (instanceName, status, message) {
    if (!this.modules[instanceName]) {
      throw new Error(`Module with instanceName of ${instanceName} not registered`)
    }

    this.modules[instanceName].status = status
    this.modules[instanceName].lastMessage = message

    return this._updateStatus(instanceName, status, message)
  }

  /**
   * Decide which status to show on the lamp
   * @param  {Array.String} statuses Current statuses
   * @return {String}                Status with highest precidence
   */
  _worstCaseScenario (statuses) {
    let worstCase = Lamp.statusPrecedence.length

    statuses.map(status => {
      if (Lamp.statusPrecedence.includes(status)) {
        worstCase = Math.min(worstCase, Lamp.statusPrecedence.indexOf(status))
      }
    })

    return Lamp.statusPrecedence[worstCase]
  }

  /**
   * Loop through registered modules and decide the worst of current statuses
   * @return {String} status
   */
  _getWorstStatus () {
    return this._worstCaseScenario(Object.keys(this.modules).map(moduleName => this.modules[moduleName].status))
  }

  /**
   * If the status has changed, send the new status to the light
   * @param  {String}  instanceName
   * @param  {String}  setStatus       The status to update it to
   * @param  {String}  message      Message to be logged
   * @return {Promise}
   */
  async _updateStatus (instanceName, setStatus, message) {
    const worstStatus = this._getWorstStatus()

    const hasChanged = worstStatus !== this.status

    this.log(hasChanged ? 'info' : 'debug', message, setStatus, instanceName)

    if (hasChanged) {
      return this._setStatus(setStatus)
    }
  }

  /**
   * Set a lamp to a status and save. If no status given it will reset to initial
   * @param  {String}  [status] The name of the status
   * @param  {Boolean} force Force an update even if status already set
   * @return {Promise}
   */
  async _setStatus (status, force) {
    const settings = status ? this.config.hue.statuses[status] : this.initialState

    this.isDirty = true
    this.status = status

    return this._save(settings, force)
  }

  /**
   * Force lamp to be updated (with worst status)
   * @return {Promise}
   */
  async forceUpdate () {
    if (Object.keys(this.modules).length) {
      return this._setStatus(this._getWorstStatus(), true)
    }
  }

  /**
   * Set settings and push them to the lamp
   * @param  {Object}  settings Settings for the light
   * @param  {Number}  settings.hue
   * @param  {Number}  settings.brightness
   * @param  {Number}  settings.saturation
   * @param  {Boolean}  settings.alert
   * @param  {Boolean} force Force an update even if status already set
   * @return {Promise}
   */
  async _save (settings, force) {
    this.light.hue = settings.hue
    this.light.saturation = settings.saturation
    this.light.brightness = settings.brightness

    if (!force) {
      this.light.alert = settings.flashing ? 'lselect' : 'none'
    }

    return this.lights.save(this.light)
  }

  /**
   * Set the lamp to alert mode
   * @param  {String}  message message to be sent to debug log
   *                           (why are you changing status)
   * @return {Promise}
   */
  async alert (message) {
    return this._setStatus('alert')
  }

  /**
   * Set the lamp to warning mode
   * @param  {String}  message message to be sent to debug log
   *                           (why are you changing status)
   * @return {Promise}
   */
  async warning (message) {
    return this._setStatus('warning')
  }

  /**
   * Set the lamp to ok (passing) mode
   * @param  {String}  message message to be sent to debug log
   *                           (why are you changing status)
   * @return {Promise}
   */
  async ok (message) {
    return this._setStatus('ok')
  }

  /**
   * Set the lamp to working (building) mode
   * @param  {String}  message message to be sent to debug log
   *                           (why are you changing status)
   * @return {Promise}
   */
  async working (message) {
    return this._setStatus('working')
  }

  /**
   * Reset the lamp to it's initial state
   * @return {Promise}
   */
  async reset () {
    if (this.isDirty) {
      return this._setStatus()
    }
  }
}

module.exports = Lamp
