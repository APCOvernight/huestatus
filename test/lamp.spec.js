/* eslint-disable no-unused-expressions */

const chai = require('chai')
chai.use(require('sinon-chai'))
const expect = chai.expect
const sinon = require('sinon')
const Lamp = require('../src/Lamp')

let consoleMock
let saveMock

const mockConfig = {
  hue: {
    statuses: require('../lib/default-config').hue.statuses
  },
  debug: false
}

let lightMock

const lightsMock = {
  save: () => {}
}

describe('Lamp Class', () => {
  beforeEach(() => {
    consoleMock = sinon.stub(console, 'info')
    saveMock = sinon.stub(lightsMock, 'save').resolves(true)
    lightMock = {
      hue: 1000,
      brightness: 254,
      saturation: 254,
      alert: 'none'
    }
  })

  afterEach(() => {
    consoleMock.restore()
    saveMock.restore()
  })

  it('Loads config object', () => {
    const lamp = new Lamp(mockConfig, lightMock, lightsMock)

    expect(lamp.config).to.be.an('object')
    expect(lamp.config.debug).to.be.false
  })

  it('Saves initial state', () => {
    const lamp = new Lamp(mockConfig, lightMock, lightsMock)

    expect(lamp.initialState).to.be.an('object')
    expect(lamp.initialState.hue).to.equal(1000)
  })

  it('Change status to alert', async () => {
    const lamp = new Lamp(mockConfig, lightMock, lightsMock)

    expect(lamp.isDirty).to.be.false

    await lamp.alert()

    expect(lamp.isDirty).to.be.true
    expect(lamp.light.hue).to.equal(require('../lib/default-config').hue.statuses.alert.hue)
    expect(lamp.light.alert).to.equal('lselect')
    expect(saveMock).to.be.calledOnce
  })

  it('Change status to working', async () => {
    const lamp = new Lamp(mockConfig, lightMock, lightsMock)

    expect(lamp.isDirty).to.be.false

    await lamp.working()

    expect(lamp.isDirty).to.be.true
    expect(lamp.light.hue).to.equal(require('../lib/default-config').hue.statuses.working.hue)
    expect(saveMock).to.be.calledOnce
  })

  it('Change status to ok', async () => {
    const lamp = new Lamp(mockConfig, lightMock, lightsMock)

    expect(lamp.isDirty).to.be.false

    await lamp.ok()

    expect(lamp.isDirty).to.be.true
    expect(lamp.light.hue).to.equal(require('../lib/default-config').hue.statuses.ok.hue)
    expect(lamp.light.alert).to.equal('none')
    expect(saveMock).to.be.calledOnce
  })

  it('Change status to warning', async () => {
    const lamp = new Lamp(mockConfig, lightMock, lightsMock)

    expect(lamp.isDirty).to.be.false

    await lamp.warning()

    expect(lamp.isDirty).to.be.true
    expect(lamp.light.hue).to.equal(require('../lib/default-config').hue.statuses.warning.hue)
    expect(saveMock).to.be.calledOnce
  })

  it('Register a module sets the status to null', async () => {
    const lamp = new Lamp(mockConfig, lightMock, lightsMock)

    lamp.registerModuleInstance('some-module')

    expect(lamp.modules).to.deep.equal({'some-module': { status: null }})
  })

  it('Cannot register a duplicated module instance', async () => {
    const lamp = new Lamp(mockConfig, lightMock, lightsMock)

    lamp.registerModuleInstance('some-module')

    try {
      lamp.registerModuleInstance('some-module')
      expect(0).to.equal(1)
    } catch (e) {
      expect(e.message).to.equal('Module with instanceName of some-module already registered')
    }

    expect(lamp.modules).to.deep.equal({'some-module': { status: null }})
  })

  it('A module instance can update the status', async () => {
    const ConsoleReporter = require('../src/ConsoleReporter')
    const consoleReporterInstance = new ConsoleReporter()
    consoleReporterInstance.config = { logLevel: 'info' }
    const lamp = new Lamp(mockConfig, lightMock, lightsMock, [consoleReporterInstance])

    lamp.registerModuleInstance('some-module')

    await lamp._updateModuleStatus('some-module', 'ok', 'Some message')

    expect(consoleMock).to.be.calledWith('some-module - Some message')

    consoleMock.resetHistory()

    await lamp._updateModuleStatus('some-module', 'ok', 'Some message')

    expect(consoleMock).to.not.be.calledWith('some-module - Some message')

    expect(lamp.status).to.equal('ok')
  })

  it('If status is the same debug is sent', async () => {
    const ConsoleReporter = require('../src/ConsoleReporter')
    const consoleReporterInstance = new ConsoleReporter()
    consoleReporterInstance.config = { logLevel: 'debug' }
    const lamp = new Lamp(mockConfig, lightMock, lightsMock, [consoleReporterInstance])

    lamp.registerModuleInstance('some-module')

    await lamp._updateModuleStatus('some-module', 'ok', 'Some message')

    expect(consoleMock).to.be.calledWith('some-module - Some message')

    consoleMock.resetHistory()

    await lamp._updateModuleStatus('some-module', 'ok', 'Some message')

    expect(consoleMock).to.be.calledWith('some-module - Some message')

    expect(lamp.status).to.equal('ok')
  })

  it('Duplicate status is not pushed to the lamp again', async () => {
    const lamp = new Lamp(mockConfig, lightMock, lightsMock)
    const setStatusSpy = sinon.spy(lamp, '_setStatus')

    lamp.registerModuleInstance('some-module')

    await lamp._updateModuleStatus('some-module', 'ok', 'Some message')

    expect(setStatusSpy).to.be.calledOnce

    expect(lamp.status).to.equal('ok')

    await lamp._updateModuleStatus('some-module', 'ok', 'Some message')

    expect(setStatusSpy).to.be.calledOnce
    setStatusSpy.restore()
  })

  it('A module instance cannot update the status if it has not been registered', async () => {
    mockConfig.debug = true
    const lamp = new Lamp(mockConfig, lightMock, lightsMock)

    try {
      await lamp._updateModuleStatus('some-module', 'ok', 'Some message')
      expect(0).to.equal(1)
    } catch (e) {
      expect(e.message).to.equal('Module with instanceName of some-module not registered')
    }

    expect(consoleMock).to.not.be.calledWith('some-module: Some message')
    mockConfig.debug = false
  })

  it('Reset sets light back to initial state', async () => {
    const lamp = new Lamp(mockConfig, lightMock, lightsMock)

    await lamp.warning()
    expect(lamp.light.hue).to.equal(require('../lib/default-config').hue.statuses.warning.hue)

    await lamp.reset()

    expect(lamp.light.hue).to.equal(1000)
    expect(saveMock).to.be.calledTwice
  })

  it('Reset ignores if light is already in intial state', async () => {
    const lamp = new Lamp(mockConfig, lightMock, lightsMock)

    await lamp.reset()

    expect(saveMock).to.not.be.called
  })

  it('Force update triggers a save', async () => {
    const lamp = new Lamp(mockConfig, lightMock, lightsMock)

    await lamp.warning()
    expect(lamp.light.hue).to.equal(require('../lib/default-config').hue.statuses.warning.hue)

    lamp.modules['My module Instance'] = {
      status: 'alert'
    }

    await lamp.forceUpdate()

    expect(lamp.light.hue).to.equal(require('../lib/default-config').hue.statuses.alert.hue)
    expect(saveMock).to.be.calledTwice
  })

  it('Force update doesn\'t change alert setting', async () => {
    const lamp = new Lamp(mockConfig, lightMock, lightsMock)

    await lamp.alert()
    expect(lamp.light.hue).to.equal(require('../lib/default-config').hue.statuses.alert.hue)

    expect(lamp.light.alert).to.equal('lselect')

    lamp.modules['My module Instance'] = {
      status: 'warning'
    }

    await lamp.forceUpdate()

    expect(lamp.light.alert).to.equal('lselect')

    expect(lamp.light.hue).to.equal(require('../lib/default-config').hue.statuses.warning.hue)
    expect(saveMock).to.be.calledTwice
  })

  it('Force update ignores lamps with no modules registered ', async () => {
    const lamp = new Lamp(mockConfig, lightMock, lightsMock)

    const setStatusMock = sinon.spy(lamp, '_setStatus')

    await lamp.forceUpdate()

    expect(setStatusMock).to.not.be.called
  })
})

describe('Status Precedence tests', function () {
  beforeEach(() => {
    consoleMock = sinon.stub(console, 'info')
  })

  afterEach(() => {
    consoleMock.restore()
  })

  it('if the statuses are OK, ALERT, then the status should become ALERT', async () => {
    const newStatus = new Lamp(mockConfig, lightMock, lightsMock)._worstCaseScenario(['ok', 'alert'])
    expect(newStatus).to.equal('alert')
  })

  it('if the statuses are OK, WORKING then the status should become WORKING', async () => {
    const newStatus = new Lamp(mockConfig, lightMock, lightsMock)._worstCaseScenario(['ok', 'working'])
    expect(newStatus).to.equal('working')
  })

  it('if the statuses are OK, WORKING and WARNING then the status should become WARNING', async () => {
    const newStatus = new Lamp(mockConfig, lightMock, lightsMock)._worstCaseScenario(['ok', 'working', 'warning'])
    expect(newStatus).to.equal('warning')
  })

  it('if the statuses are OK, WORKING, ALERT and WARNING then the status should become ALERT', async () => {
    const newStatus = new Lamp(mockConfig, lightMock, lightsMock)._worstCaseScenario(['ok', 'working', 'alert', 'warning'])
    expect(newStatus).to.equal('alert')
  })

  it('if unknown status is passed it is ignored', async () => {
    const newStatus = new Lamp(mockConfig, lightMock, lightsMock)._worstCaseScenario(['fake', 'ok', null])
    expect(newStatus).to.equal('ok')
  })
})
