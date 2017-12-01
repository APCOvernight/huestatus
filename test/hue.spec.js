/* eslint-disable no-unused-expressions */

const chai = require('chai')
chai.use(require('sinon-chai'))
const expect = chai.expect
const sinon = require('sinon')
const Hue = require('../src/Hue')

let HuejayMock
let connectionMock

const mockConfig = {
  hue: {
    statuses: {

    }
  },
  modules: {

  },
  debug: false
}

describe('Hue Class', () => {
  beforeEach(() => {
    HuejayMock = sinon.stub(require('huejay'), 'Client').returns({
      bridge: {
        get: () => {}
      },
      lights: {
        getAll: () => {}
      }
    })
  })

  afterEach(() => {
    HuejayMock.restore()
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
    connectionMock = sinon.stub(hue.connection, 'bridge').callsFake(() => {})

    connectionMock.restore()
  })
})
