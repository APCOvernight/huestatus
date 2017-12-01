'use strict'

const Huejay = require('huejay')
const BaseClass = require('./Class')
const Lamp = require('./Lamp')

class Hue extends BaseClass {
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

  async init () {
    this.bridge = await this._getBridge()
    this.lamps = await this._getLamps()
    this.modules = await this._loadModules()
  }

  get lampsArray () {
    const lampsArray = []
    Object.keys(this.lamps).map(lampName => { lampsArray.push(this.lamps[lampName]) })
    return lampsArray
  }

  async stop () {
    await Promise.all(this.lampsArray.map(async lamp => {
      await lamp.reset()
    }))
  }

  async start () {
    await Promise.all(this.modules.map(async module => {
      await module.start()
    }))
  }

  async _getBridge () {
    const bridge = await this.connection.bridge.get()

    this.log(`Retrieved bridge ${bridge.name}`)
    this.log(`  Id: ${bridge.id}`)
    this.log(`  Model Id: ${bridge.modelId}`)

    return bridge
  }

  async _getLamps () {
    const lamps = {}
    const lights = await this.connection.lights.getAll()

    this.log('\nLights connected:')

    await Promise.all(lights.map(async light => {
      lamps[light.name] = new Lamp(this.config, light, this.connection.lights)
    }))

    return lamps
  }

  async _loadModules () {
    const modules = []

    Object.keys(this.config.modules).map(moduleName => {
      const moduleConfig = this.config.modules[moduleName]

      try {
        const Module = require(moduleName)
        const lamp = this.lampsArray.filter(lamp => lamp.name === moduleConfig.light)[0]

        const instance = new Module(moduleConfig, lamp)

        modules.push(instance)
      } catch (e) {
        // Throw nice errors here

        console.error(e)
      }
    })

    return modules
  }
}

module.exports = Hue
