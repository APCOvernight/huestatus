# HueStatus

[![NPM Package](https://img.shields.io/npm/v/huestatus.svg?maxAge=2592000)](https://npmjs.com/package/huestatus) ![License](https://img.shields.io/npm/l/huestatus.svg) [![Build Status](https://travis-ci.org/APCOvernight/huestatus.svg?branch=master)](https://travis-ci.org/APCOvernight/huestatus) [![Coverage Status](https://coveralls.io/repos/github/APCOvernight/huestatus/badge.svg?branch=master)](https://coveralls.io/github/APCOvernight/huestatus?branch=master) [![Maintainability](	https://img.shields.io/codeclimate/maintainability/APCOvernight/huestatus.svg)](https://codeclimate.com/github/APCOvernight/huestatus/maintainability) 
[![Dependencies](https://img.shields.io/david/APCOvernight/huestatus.svg)](https://david-dm.org/APCOvernight/huestatus) [![Greenkeeper badge](https://badges.greenkeeper.io/APCOvernight/huestatus.svg)](https://greenkeeper.io/)

Modular status light system for use with Philips Hue devices

## Features
- Set a Philips Hue light to one of 4 statuses (Ok, Warning, Building, Alert)
- Works with multiple lights
- Works with multiple modules

## Installation

```
npm install -g huestatus
```

Create a .huerc file on your home directory, or the directory you will run `huestatus` from. 

```js
{
  "hue": {
    "host": "192.168.0.2", // Address of your Philips Hue Bridge
    "port": 80, // Port of the Philips Hue Bridge
    "username": "", // Philips Hue Bridge API username - (See https://www.developers.meethue.com/documentation/getting-started)
    "timeout": 2000, // Connection timeout for Philips Hue Bridge requests
    "statuses": { // Settings for each status
      "working": {
        "hue": 46920, // Color Hue Key - Between 0 and 65535
        "brightness": 155, // Brightness between 0 and 254
        "saturation": 155, // Saturation betweern 0 and 254
        "flashing": false // Should the light flash?
      }
      // ... Settings for each status (working, ok, building and alert) can be set separately
    }
  },
  "modules": [ // Array of module instances and their settings. Each module can be used again with different settings or a different light
    {
      "name": "huekins", // The name of the module. The module must be installed globally (i.e. npm i -g huekins)
      "light": "Hue color lamp 1", // The name of the light you want this module to control
      "url": "http://jenkins/", // Settings specific to the module
      "job": "MyJob/Develop"
    }, {
      "name": "huetry",
      "light": "Hue color lamp 2",
      "sentryApiKey": "3abxxxxxxxxxxxxxxxxx0f5",
      "project": "",
      "organisation": ""
    }
  ],
  "reporters": [ // Array of reporter modules and their settings
    {
      "name": "huelog-slack", // The name of the module. The module must be installed globally (i.e. npm i -g huekins)
      "logLevel": "", // Level of logging to pass to this reporter (debug, info, error)
      "slackWebhookUrl": "" // Settings specific to the module
    }
  ]
  "debug": true // Show debug logging info in console
}

```

Then run `huestatus`.  `Huestatus` will connect to your Philips Hue Bridge, and load in all the configured modules then continue running, waiting for the modules to update the status. It is recommended to run `huestatus` with a process manager like [PM2](https://npmjs.org/package/pm2)

## Supported Modules

- HueKins - Jenkins build monitor - [GitHub](https://github.com/APCOvernight/huekins) - [NPM](https://www.npmjs.com/package/huekins)
- HueTry - Sentry issue alerts - [GitHub](https://github.com/APCOvernight/huetry) - [NPM](https://www.npmjs.com/package/huetry)
- HueTimeRobot - Uptime Robot monitor -  [GitHub](https://github.com/APCOvernight/huetimerobot) - [NPM](https://www.npmjs.com/package/huetimerobot)


## Module development template

Visit [HueStatusModule](https://github.com/APCOvernight/HueStatusModule) For a template starter module with more instructions.

## Loggers/Reporters

Status changes are logged to STDOUT by default. This can be helpful if you have several modules using the same light to find out what's caused it to turn red.

But all team members may not have access to the terminal logs so reporters can be added to publish more accessible logs.

## Supported Reporters

- HueLog Slack - Push status changes to a slack channel [GitHub](https://github.com/APCOvernight/huelog-slack) - [NPM](https://www.npmjs.com/package/huelog-slack)

- HueLog Status Page - Serve a webpage with a list of recent log events [GitHub](https://github.com/APCOvernight/huelog-statuspage) - [NPM](https://www.npmjs.com/package/huelog-statuspage)

## Reporter development

Reporters work in a similar way to [status modules](https://github.com/APCOvernight/HueStatusModule) but they don't have a base class to extend. All they need is a start and a log method. They are registered in the reporters array of `.huerc`.
