'use strict'

const BaseClass = require('./Class')
const events = require('events')

class Lamp extends BaseClass {
  /**
   * @param  {Object} config Configuration
   * @param  {Object} light  HueJay Light instance
   * @param  {Object} lights HueJay Lights instance
   */
  constructor (config, light, lights) {
    super(config)
    this.light = light
    this.lights = lights
    this.name = light.name

    this.isDirty = false

    this.modules = {}

    this.eventEmitter = new events.EventEmitter()
    this.eventEmitter.on('change', this._updateModuleStatus.bind(this))

    this.initialState = this._getState()

    this.log(`  💡  ${this.name} is ${!this.light.reachable ? 'not ' : ''}reachable ${this.light.reachable ? '✅' : '⛔️'}`)

    this.statusPrecedence = ['alert', 'warning', 'working', 'ok']
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

  registerModule (moduleName) {
    this.modules[moduleName] = { status: null }
  }

  async _updateModuleStatus (moduleName, status, message) {
    this.modules[moduleName].status = status
    this.modules[moduleName].lastMessage = message

    this.log(`${this.moduleName}: ${message}`)

    await this._updateStatus()
  }

  _worstCaseScenario (statuses) {
    let worstCase = this.statusPrecedence.length

    statuses.map(status => {
      if (this.statusPrecedence.includes(status)) {
        worstCase = Math.min(worstCase, this.statusPrecedence.indexOf(status))
      }
    })

    return this.statusPrecedence[worstCase]
  }

  async _updateStatus () {
    const status = this._worstCaseScenario(Object.keys(this.modules).map(moduleName => this.modules[moduleName].status))

    if (status !== this.status) {
      await this._setStatus(status)
    }
  }

  /**
   * Set a lamp to a status and save. If no status given it will reset to initial
   * @param  {String}  [status] The name of the status
   * @return {Promise}
   */
  async _setStatus (status) {
    const settings = status ? this.config.hue.statuses[status] : this.initialState

    await this._save(settings)

    this.status = status
  }

  /**
   * Set settings and push them to the lamp
   * @param  {Object}  settings Settings for the light
   * @param  {Number}  settings.hue
   * @param  {Number}  settings.brightness
   * @param  {Number}  settings.saturation
   * @param  {Boolean}  settings.alert
   * @return {Promise}
   */
  async _save (settings) {
    this.light.hue = settings.hue
    this.light.saturation = settings.saturation
    this.light.brightness = settings.brightness
    this.light.alert = settings.flashing ? 'lselect' : 'none'

    await this.lights.save(this.light)

    this.isDirty = true
  }

  /**
   * Set the lamp to alert mode
   * @param  {String}  message message to be sent to debug log
   *                           (why are you changing status)
   * @return {Promise}
   */
  async alert (message) {
    await this._setStatus('alert')
  }

  /**
   * Set the lamp to warning mode
   * @param  {String}  message message to be sent to debug log
   *                           (why are you changing status)
   * @return {Promise}
   */
  async warning (message) {
    await this._setStatus('warning')
  }

  /**
   * Set the lamp to ok (passing) mode
   * @param  {String}  message message to be sent to debug log
   *                           (why are you changing status)
   * @return {Promise}
   */
  async ok (message) {
    await this._setStatus('ok')
  }

  /**
   * Set the lamp to working (building) mode
   * @param  {String}  message message to be sent to debug log
   *                           (why are you changing status)
   * @return {Promise}         [description]
   */
  async working (message) {
    await this._setStatus('working')
  }

  /**
   * Reset the lamp to it's initial state
   * @return {Promise}
   */
  async reset () {
    if (this.isDirty) {
      await this._setStatus()
    }
  }
}

module.exports = Lamp
