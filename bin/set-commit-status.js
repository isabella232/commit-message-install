#!/usr/bin/env node

'use strict'

const debug = require('debug')('commit-message-install')
const os = require('os')
const path = require('path')

const allArgs = process.argv.slice(2)
const args = require('minimist')(allArgs, {
  alias: {
    file: 'f',
    sha: 'commit',
    description: 'd'
  },
  string: ['file', 'sha', 'state', 'label', 'description']
})

const api = require('..')
const getMessage = api.getMessage
const getJsonBlock = api.getJsonBlock
const setCommitStatus = api.setCommitStatus

function onError (e) {
  console.error(e)
  process.exit(1)
}

let start
if (args.file) {
  console.log('loading message from file', args.file)
  const fs = require('fs')
  const message = fs.readFileSync(args.file, 'utf8')
  start = Promise.resolve(message)
} else {
  start = getMessage(args.sha)
}
start
  .then(getJsonBlock)
  .then(json => {
    if (!json) {
      debug('could not find JSON block in the Git message')
      return
    }

    const status = json.status
    if (!status) {
      debug('could not find status object in the block %o', json)
      return
    }

    if (!args.label) {
      const name = require(path.join(process.cwd(), 'package.json')).name
      args.label = `${os.platform()}-${os.arch()} ${name}`
    }

    return setCommitStatus(args.label, args.state, args.description, status)
  })
  .catch(onError)
