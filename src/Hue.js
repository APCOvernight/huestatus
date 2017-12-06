'use strict'

const Huejay = require('huejay')
const BaseClass = require('./Class')
const Lamp = require('./Lamp')

/**
 * Represents a Hue Bridge
 * @extends BaseClass
 */
class Hue extends BaseClass {
  /**
   * @param  {Object} config Configuration
   */
  constructor (config) {
    super(config)
    this._registerListeners()
    this.reporters = this._loadReporters()
    this.info(`Loaded Config from ${config.config}:\n`, config)

    this.connection = new Huejay.Client({
      host: config.hue.host,
      port: config.hue.port,
      username: config.hue.username,
      timeout: config.hue.timeout
    })
  }

  /**
   * Register process listeners
   */
  _registerListeners () {
    process.on('SIGINT', this._sigIntHandler.bind(this))
    process.on('unhandledRejection', this._unhandledRejectionHandler.bind(this))
  }

  /**
   * Reset all lamps on process interruption
   */
  async _sigIntHandler () {
    await this.stop()
    process.exit()
  }

  /**
   * Log unhandledRejections nicely
   */
  _unhandledRejectionHandler (error) {
    this.error(error.message)
  }

  /**
   * Load the bridge, lights and modules
   */
  async init () {
    this.bridge = await this._getBridge()
    this.lamps = await this._getLamps()
    this.modules = await this._loadModules()
  }

  /**
   * get lamps as an array
   * @return {Array}
   */
  get lampsArray () {
    const lampsArray = []
    Object.keys(this.lamps).map(lampName => { lampsArray.push(this.lamps[lampName]) })
    return lampsArray
  }

  /**
   * Reset all lamps
   * @return {Promise}
   */
  async stop () {
    await Promise.all(this.lampsArray.map(async lamp => {
      await lamp.reset()
    }))
  }

  /**
   * Fire the start method on all modules and reporters
   * @return {Promise}
   */
  async start () {
    setInterval(async () => {
      await Promise.all(this.lampsArray.map(async lamp => lamp.forceUpdate()))
    }, 10000)
    await Promise.all(this.reporters.map(async reporter => {
      await reporter.start()
    }))
    await Promise.all(this.modules.map(async module => {
      await module.start()
    }))
  }

  /**
   * Get bridge debug info
   * @return {Object}
   */
  async _getBridge () {
    const bridge = await this.connection.bridge.get()

    this.debug(`Retrieved bridge ${bridge.name}`)
    this.debug(`  Id: ${bridge.id}`)
    this.debug(`  Model Id: ${bridge.modelId}`)

    return bridge
  }

  /**
   * Get all lamps connected to bridge
   * @return {Object} Lamps indexed by name
   */
  async _getLamps () {
    const lamps = {}
    const lights = await this.connection.lights.getAll()

    this.info('\nLights connected:')

    await Promise.all(lights.map(async light => {
      lamps[light.name] = new Lamp(this.config, light, this.connection.lights, this.reporters)
    }))

    return lamps
  }

  /**
   * Load all modules defined in config
   * @return {Array}
   * @throws Error if module cannot be loaded
   * @throws Error if module is not an instance of Base Module
   */
  async _loadModules () {
    const modules = []

    this.config.modules.map(module => {
      try {
        const Module = require(require('requireg').resolve(module.name) || module.name)
        const lamp = this.lampsArray.filter(lamp => lamp.name === module.light)[0]

        const instance = new Module(module, lamp.eventEmitter)

        if (!(instance instanceof require('../src/Module'))) {
          throw new Error(`${module.name} does not extend the Base Module ('huestatus/src/Module')`)
        }

        lamp.registerModuleInstance(instance.instanceName)

        modules.push(instance)

        this.debug(`${module.name} module loaded`)
      } catch (e) {
        console.info(e.message)
        throw e
      }
    })

    return modules
  }

  /**
   * Load all reporters defined in config
   * @return {Array.Object}
   * @throws Error if reporter cannot be loaded
   * @throws Error if reporter hasn't got start or log methods
   */
  _loadReporters () {
    const reporters = []

    const consoleReporterConfig = {
      name: './ConsoleReporter',
      logLevel: this.config.debug ? 'debug' : 'info'
    }

    this.config.reporters.concat([consoleReporterConfig]).map(reporter => {
      try {
        const Reporter = require(require('requireg').resolve(reporter.name) || reporter.name)
        const instance = new Reporter(reporter)
        instance.config = reporter

        if (typeof instance.start !== 'function' || typeof instance.log !== 'function') {
          throw new Error(`${reporter.name} reporter must have a start method and a log method`)
        }

        reporters.push(instance)
      } catch (e) {
        console.info(e.message)
        throw e
      }
    })

    return reporters
  }
}

module.exports = Hue
