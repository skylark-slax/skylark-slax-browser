#!/usr/bin/env node
var program = require('commander');
 
const electron = require('electron');
const proc = require('child_process');
const path = require('path');
const readline = require('readline')


const skylarker = path.join(__dirname,"../main.js");

//const bunyan = require('bunyan'); 
//const spawnasync = require('spawn-async');
//var log = new bunyan({
//    'name': path.basename(process.argv[1]),
//    'level': process.env['LOG_LEVEL'] || 'debug'
//});
//const worker = spawnasync.createWorker({ 'log': log });


var _exit = process.exit;
var pkg = require('../package.json');

var version = pkg.version;

// Re-assign process.exit because of commander
// TODO: Switch to a different command framework
process.exit = exit;

// CLI

around(program, 'optionMissingArgument', function (fn, args) {
  program.outputHelp()
  fn.apply(this, args)
  return { args: [], unknown: [] }
})

before(program, 'outputHelp', function () {
  // track if help was shown for unknown option
  this._helpShown = true
})

before(program, 'unknownOption', function () {
  // allow unknown options if help was shown, to prevent trailing error
  this._allowUnknownOption = this._helpShown

  // show help if not yet shown
  if (!this._helpShown) {
    program.outputHelp()
  }
})

program
  .name('sbrowse')
  .version(version, '    --version')
  .usage('<slaxapp>')
  .parse(process.argv)

if (!exit.exited) {
  main()
}


/**
 * Install an around function; AOP.
 */

function around (obj, method, fn) {
  var old = obj[method]

  obj[method] = function () {
    var args = new Array(arguments.length)
    for (var i = 0; i < args.length; i++) args[i] = arguments[i]
    return fn.call(this, old, args)
  }
}

/**
 * Install a before function; AOP.
 */

function before (obj, method, fn) {
  var old = obj[method]

  obj[method] = function () {
    fn.call(this)
    old.apply(this, arguments)
  }
}

/**
 * Prompt for confirmation on STDOUT/STDIN
 */

function confirm (msg, callback) {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question(msg, function (input) {
    rl.close()
    callback(/^y|yes|ok|true$/i.test(input))
  })
}


function browse(slaxAppPath) {
//  worker.aspawn(["start",electron,skylarker,slaxAppPath],
//    function (err, stdout, stderr) {
//        if (err) {
//            console.log('error: %s', err.message);
//            console.error(stderr);
//        } else {
//            console.log(stdout);
//            worker.destroy();
//        }
//    });
  var child = proc.spawn(electron,[skylarker,slaxAppPath]);

  child.on('exit', function(){
    process.exit(0);
  });
}

/**
 * Main program.
 */

function main () {
  // Path
  var slaxAppPath = program.args.shift();
  if (slaxAppPath) {
    browse(slaxAppPath);
  } else {
      confirm('The slax application is not specified, do you want to open the example application?? [y/N] ', function (ok) {
        if (ok) {
          process.stdin.destroy()
          slaxAppPath = path.join(__dirname,"..","samples","chapters.slax");
          browse(slaxAppPath);
        } else {
          console.error('aborting');
          exit(1);
        }
      });
  }


}

/**
 * Graceful exit for async STDIO
 */

function exit (code) {
  // flush output for Node.js Windows pipe bug
  // https://github.com/joyent/node/issues/6247 is just one bug example
  // https://github.com/visionmedia/mocha/issues/333 has a good discussion
  function done () {
    if (!(draining--)) _exit(code)
  }

  var draining = 0
  var streams = [process.stdout, process.stderr]

  exit.exited = true

  streams.forEach(function (stream) {
    // submit empty write request and wait for completion
    draining += 1
    stream.write('', done)
  })

  done()
}
