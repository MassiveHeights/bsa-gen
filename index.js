#!/usr/bin/env node
'use strict';

const AudioSprite = require('audiosprite-pkg');
const async = require('async');
const program = require('commander');
const glob = require('glob-fs')({ gitignore: true });

program
  .version('1.0.0')
  .usage('--in <input files> --out <filename>;\n  Example: --in *.mp3 --out atlas')
  .option('-i, --in [input files]', 'input files mask')
  .option('-o, --out [filename]', 'output file')
  .option('-v, --vbr [0-9]', 'VBR. Default: 7 (80-120 kbs)')
  .option('-m, --mono [true/false]', 'specifies stereo/mono. Default: false')
  .parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
  return;
}

AudioSprite.prototype.outputJson = function (format) {
  if (format === 'black') {
    var finalJson = {
      v: 0.6,
      format: 'bsa',
      sounds: {}
    };
    for (let sn in this._json.spritemap) {
      let spriteInfo = this._json.spritemap[sn];
      finalJson.sounds[sn] = [spriteInfo.start, spriteInfo.end - spriteInfo.start];
    }
    return finalJson;
  }
}

let outName = (program.out || 'out');
let waterfall = [];
let outputAudio = outName + '.mp3';
let outputJson = outName + '.json';

let as = new AudioSprite({ VBR: program.vbr || 7, channelCount: program.mono ? 1 : 2, trackGap: 0 });
let files = glob.readdirSync(program.in, {});

if (files.length === 0) {
  console.log('No files were found');
  program.outputHelp();
  return;
}

files.forEach(x => {
  waterfall.push(cb => {
    as.inputFile(x, cb);
  });
});

waterfall.push(cb => {
  as.outputFile(outputAudio, { format: 'mp3' }, cb);
});

waterfall.push(cb => {
  as.outputJsonFile(outputJson, 'black');
  cb();
});

async.waterfall(waterfall, err => {
  if (err) {
    console.log('An error occurred!', err);
  } else {
    console.log(`Merged ${files.length} files`);
  }
});