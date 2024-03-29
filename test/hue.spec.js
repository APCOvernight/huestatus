/* eslint-disable no-unused-expressions */

const chai = require('chai')
chai.use(require('sinon-chai'))
const expect = chai.expect
const sinon = require('sinon')
const Hue = require('../src/Hue')

let HuejayMock
let connectionMock
let consoleMock
let onStub

const mockConfig = {
  hue: {
    statuses: {

    }
  },
  modules: [],
  reporters: [],
  debug: false
}

describe('Hue Class', () => {
  beforeEach(() => {
    consoleMock = sinon.stub(console, 'info')
    onStub = sinon.stub(process, 'on')

    HuejayMock = sinon.stub(require('huejay'), 'Client').returns({
      bridge: {
        get: async () => { return {} }
      },
      lights: {
        getAll: async () => []
      }
    })
  })

  afterEach(() => {
    onStub.restore()
    HuejayMock.restore()
    consoleMock.restore()
  })

  it('Sets up process listeners', () => {
    const hue = new Hue(mockConfig)
    expect(hue.config).to.be.an('object')

    expect(onStub).to.be.calledWith('SIGINT')
    expect(onStub).to.be.calledWith('unhandledRejection')
  })

  it('Loads config object', () => {
    const hue = new Hue(mockConfig)
    expect(hue.config).to.be.an('object')
    expect(hue.config.debug).to.be.false

    expect(HuejayMock).to.be.calledOnce
  })

  it('Loads HueJay connection', () => {
    const hue = new Hue(mockConfig)

    expect(hue.connection).to.be.an('object')

    expect(HuejayMock).to.be.calledOnce
  })

  it('Load bridge info on init', async () => {
    const hue = new Hue(mockConfig)
    connectionMock = sinon.stub(hue.connection.bridge, 'get').resolves({
      name: 'Hue Bridge',
      id: 1,
      modelId: 'v1'
    })

    await hue.init()

    expect(hue.bridge).to.be.an('object')
    expect(consoleMock).to.not.be.calledWith('Retrieved bridge Hue Bridge')

    connectionMock.restore()
  })

  it('Loads default consoleReporter', () => {
    const hue = new Hue(mockConfig)
    expect(hue.reporters).to.be.an('array')
  })

  it('Starts reporters', async () => {
    const hue = new Hue(mockConfig)
    connectionMock = sinon.stub(hue.connection.lights, 'getAll').resolves([{
      name: 'My first light'
    }])

    expect(hue.reporters).to.be.an('array')

    await hue.init()

    this.clock = sinon.useFakeTimers()
    await hue.start()
    this.clock.restore()

    expect(hue.reporters[0].started).to.equal(true)
  })

  it('Log bridge info on init if debug is set', async () => {
    mockConfig.debug = true
    const hue = new Hue(mockConfig)
    connectionMock = sinon.stub(hue.connection.bridge, 'get').resolves({
      name: 'Hue Bridge',
      id: 1,
      modelId: 'v1'
    })

    await hue.init()

    expect(consoleMock).to.be.calledWith('Retrieved bridge Hue Bridge')
    expect(consoleMock).to.be.calledWith('  Id: 1')
    expect(consoleMock).to.be.calledWith('  Model Id: v1')

    connectionMock.restore()
    mockConfig.debug = false
  })

  it('Load lights info on init', async () => {
    const hue = new Hue(mockConfig)
    connectionMock = sinon.stub(hue.connection.lights, 'getAll').resolves([{
      name: 'My first light'
    }, {
      name: 'Another light',
      reachable: true
    }])

    await hue.init()

    expect(hue.lamps).to.be.an('object')
    expect(hue.lamps['My first light']).to.be.an('object')
    expect(hue.lamps['My first light'].constructor.name).to.equal('Lamp')

    expect(hue.lampsArray).to.be.an('array')
    expect(hue.lampsArray[0]).to.be.an('object')
    expect(hue.lampsArray[0].constructor.name).to.equal('Lamp')

    expect(consoleMock).to.be.calledWith('  💡  My first light is not reachable ⛔️')
    expect(consoleMock).to.be.calledWith('  💡  Another light is reachable ✅')

    connectionMock.restore()
  })

  it('Load modules on init', async () => {
    mockConfig.debug = true
    mockConfig.modules = [
      {
        name: '../test/mock-module',
        light: 'My first light'
      }
    ]

    const hue = new Hue(mockConfig)
    connectionMock = sinon.stub(hue.connection.lights, 'getAll').resolves([{
      name: 'My first light'
    }])

    await hue.init()

    expect(hue.modules.length).to.equal(1)
    expect(hue.modules[0].emitter).to.be.an('object')
    expect(hue.modules[0].config).to.be.an('object')
    expect(hue.modules[0].config).to.deep.equal(mockConfig.modules[0])
    expect(hue.modules[0].start).to.be.a('function')
    expect(hue.modules[0].instanceName).to.be.a('string')

    expect(consoleMock).to.be.calledWith('../test/mock-module module loaded')

    connectionMock.restore()
    mockConfig.modules = []
    mockConfig.debug = false
  })

  it('Throws when the module cannot be found', async () => {
    mockConfig.debug = true
    mockConfig.modules = [
      {
        name: 'null',
        light: 'My first light'
      }
    ]

    const hue = new Hue(mockConfig)

    try {
      await hue.init()
      expect(0).to.equal(1)
    } catch (e) {
      expect(e.message.split('\n')[0]).to.equal('Cannot find module \'null\'')
    }

    mockConfig.modules = []
    mockConfig.debug = false
  })

  it('Throws when the module does not extend base module', async () => {
    mockConfig.debug = true
    mockConfig.modules = [
      {
        name: '../test/bad-mock-module',
        light: 'My first light'
      }
    ]

    const hue = new Hue(mockConfig)

    connectionMock = sinon.stub(hue.connection.lights, 'getAll').resolves([{
      name: 'My first light'
    }])

    try {
      await hue.init()
      expect(0).to.equal(1)
    } catch (e) {
      expect(e.message).to.equal('../test/bad-mock-module does not extend the Base Module (\'huestatus/src/Module\')')
    }

    mockConfig.modules = []
    mockConfig.debug = false
  })

  it('Throws when the reporter cannot be found', async () => {
    mockConfig.debug = true
    mockConfig.reporters = [
      {
        name: 'null',
        logLevel: 'info'
      }
    ]

    try {
      const hue = new Hue(mockConfig)
      await hue.init()
      expect(0).to.equal(1)
    } catch (e) {
      expect(e.message.split('\n')[0]).to.equal('Cannot find module \'null\'')
    }

    mockConfig.reporters = []
    mockConfig.debug = false
  })

  it('Throws when the reporter does not extend base reporter', async () => {
    mockConfig.debug = true
    mockConfig.reporters = [
      {
        name: '../test/bad-reporter',
        logLevel: 'info'
      }
    ]

    try {
      const hue = new Hue(mockConfig)
      await hue.init()
      expect(0).to.equal(1)
    } catch (e) {
      expect(e.message).to.equal('../test/bad-reporter reporter must have a start method and a log method')
    }

    mockConfig.reporters = []
    mockConfig.debug = false
  })

  it('Fire reset on all lamps on stop', async () => {
    const hue = new Hue(mockConfig)
    connectionMock = sinon.stub(hue.connection.lights, 'getAll').resolves([{
      name: 'My first light'
    }])

    const exitStub = sinon.stub(process, 'exit')

    await hue.init()

    sinon.stub(hue.lamps['My first light'], 'reset')

    await hue._sigIntHandler()

    expect(hue.lamps['My first light'].reset).to.be.calledOnce
    expect(exitStub).to.be.calledOnce

    exitStub.restore()
    hue.lamps['My first light'].reset.restore()
  })

  it('Catches unhandled rejection errors', async () => {
    mockConfig.debug = true
    const hue = new Hue(mockConfig)
    hue._unhandledRejectionHandler(new Error('Some Error'))
    expect(consoleMock).to.be.calledWith('Some Error')
    mockConfig.debug = false
  })

  it('Modules get started on start', async () => {
    mockConfig.modules = [
      {
        name: '../test/mock-module',
        light: 'My first light'
      }
    ]

    const hue = new Hue(mockConfig)
    connectionMock = sinon.stub(hue.connection.lights, 'getAll').resolves([{
      name: 'My first light'
    }])

    await hue.init()

    sinon.stub(hue.modules[0], 'start')

    this.clock = sinon.useFakeTimers()
    await hue.start()
    this.clock.restore()

    expect(hue.modules[0].start).to.be.calledOnce

    hue.modules[0].start.restore

    connectionMock.restore()
    mockConfig.modules = []
  })

  it('Lamps get updated every 10 seconds in case light has been turned off', async () => {
    mockConfig.modules = [
      {
        name: '../test/mock-module',
        light: 'My first light'
      }
    ]

    const hue = new Hue(mockConfig)
    connectionMock = sinon.stub(hue.connection.lights, 'getAll').resolves([{
      name: 'My first light'
    }])

    await hue.init()

    const forceUpdateMock = sinon.stub(hue.lamps['My first light'], 'forceUpdate')

    sinon.stub(hue.modules[0], 'start')

    this.clock = sinon.useFakeTimers()
    await hue.start()

    this.clock.tick(9000)

    expect(forceUpdateMock).to.not.be.called

    this.clock.tick(2000)

    expect(forceUpdateMock).to.be.calledOnce

    this.clock.restore()

    expect(hue.modules[0].start).to.be.calledOnce

    hue.modules[0].start.restore

    forceUpdateMock.restore()
    connectionMock.restore()
    mockConfig.modules = []
  })
})
