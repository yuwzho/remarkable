/*global describe, it*/
'use strict';


var fs = require('fs');
var path = require('path');
var assert = require('assert');
var replaceEntities = require('../lib/common/utils.js').replaceEntities;
var Remarkable = require('../');

describe('inline-text-pos', function () {
  it ('should report inline text position', function() {
  var md = new Remarkable('full', {
    html: true,
    langPrefix: '',
    typographer: true,
    linkify: true
  });
  testInlinePosition(md, '==f **o ==o b== a** r==');
  });
});

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
  if (md.indexOf('&#98765432;') > 0) { return; }

  markdown.core.ruler.disable('replacements');
  markdown.core.ruler.disable('smartquotes');
  markdown.core.ruler.disable('footnote_tail');
  markdown.inline.ruler.disable('footnote_inline');
  markdown.inline.ruler.disable('footnote_ref');

  var tokens = markdown.parse(md, {});

  markdown.core.ruler.enable('replacements');
  markdown.core.ruler.enable('smartquotes');
  markdown.core.ruler.enable('footnote_tail');
  markdown.inline.ruler.enable('footnote_inline');
  markdown.inline.ruler.enable('footnote_ref');

  for (var i = tokens.length - 1; i >= 0; i--) {
    var token = tokens[i];
    if (token.type === 'inline') {
      if (typeof token.pos !== 'undefined') {
        if (token.content === '') { continue; } // For ref links
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
        assert.strictEqual(content, slice);
        testTextPosition(token.content, token.children);
      } else {
        console.warn('inline not implemented: ' + token.content);
      }
    }
  }
}

function testTextPosition(content, tokens) {
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    if (token.type === 'text') {
      if (typeof token.pos !== 'undefined') {
        var text = replaceEntities(content.slice(token.pos[0], token.pos[1])).replace(/\\/g, '');
        assert.strictEqual(token.content.replace(/\\/g, '').trim(), text.trim());
      } else {
        console.warn('text not implemented: ' + token.content);
      }
    }
  }
}

module.exports.addTests = addTests;
