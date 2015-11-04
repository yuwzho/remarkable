/*global describe, it*/
'use strict';


var fs = require('fs');
var path = require('path');
var assert = require('assert');


function addTests(fPath, markdown, skip) {
  var input,
      stat = fs.statSync(fPath);

  if (stat.isFile()) {
    input = fs.readFileSync(fPath, 'utf8');

    input = input.replace(/→/g, '\t');

    describe(fPath, function () {
      input.replace(/^\.\n([\s\S]*?)^\.\n([\s\S]*?)^\.$/gm, function(__, md, html, offset, orig) {
        var line = orig.slice(0, offset).split(/\r?\n/g).length;

        // Also skip tests if file name starts with "_"
        if (!skip && path.basename(fPath)[0] !== '_') {
          it('line ' + line, function () {
            assert.strictEqual(html, markdown.render(md));
            testInlinePosition(markdown, md);
          });
        } else {
          it.skip('line ' + line, function () {
            assert.strictEqual(html, markdown.render(md));
          });
        }
      });
    });

    return;
  }

  if (stat.isDirectory()) {
    fs.readdirSync(fPath).forEach(function (name) {
      addTests(path.join(fPath, name), markdown, skip);
    });
  }
}

function testInlinePosition(markdown, md) {
  var tokens = markdown.parse(md, {});
  for (var i = tokens.length - 1; i >= 0; i--) {
    var token = tokens[i];
    if (token.type === 'inline') {
      if (typeof token.pos !== 'undefined') {
        if (token.content === '') { continue; }
        var content = token.content;
        var preprocessedMd = markdown.preprocess(md);
        var slice = preprocessedMd.slice(token.pos[0], token.pos[1]);
        if (token.trivias) {
          var lines = content.split('\n');
          for (var j = 1; j < lines.length; j++) {
            lines[j] = (token.trivias[j] || '') + lines[j];
          }
          content = lines.join('\n');
        }
        if (content !== slice) {
          console.log(token);
        }
        assert.strictEqual(content, slice);
      } else {
        console.warn('not implemented: ' + token.content);
      }
    }
  }
}


module.exports.addTests = addTests;
