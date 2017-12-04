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
    this.log(`Loaded Config from ${config.config}:\n`, config)

    this.connection = new Huejay.Client({
      host: config.hue.host,
      port: config.hue.port,
      username: config.hue.username,
      timeout: config.hue.timeout
    })
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
   * Fire the start method on all modules
   * @return {Promise}
   */
  async start () {
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

    this.log(`Retrieved bridge ${bridge.name}`)
    this.log(`  Id: ${bridge.id}`)
    this.log(`  Model Id: ${bridge.modelId}`)

    return bridge
  }

  /**
   * Get all lamps connected to bridge
   * @return {Object} Lamps indexed by name
   */
  async _getLamps () {
    const lamps = {}
    const lights = await this.connection.lights.getAll()

    this.log('\nLights connected:')

    await Promise.all(lights.map(async light => {
      lamps[light.name] = new Lamp(this.config, light, this.connection.lights)
    }))

    return lamps
  }

  /**
   * Load all modules defined in config
   * @return {Array}
   */
  async _loadModules () {
    const modules = []

    Object.keys(this.config.modules).map(moduleName => {
      const moduleConfig = this.config.modules[moduleName]

      try {
        const Module = require(moduleName)
        const lamp = this.lampsArray.filter(lamp => lamp.name === moduleConfig.light)[0]

        const instance = new Module(moduleConfig, lamp.eventEmitter, moduleName)

        lamp.registerModule(moduleName)

        modules.push(instance)

        this.log(`${moduleName} module loaded`)
      } catch (e) {
        // Throw nice errors here
        console.error(e.message)
        throw e
      }
    })

    return modules
  }
}

module.exports = Hue
