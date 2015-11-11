// Inline parser state

'use strict';


function StateInline(src, parserInline, options, env, outTokens) {
  this.src = src;
  this.env = env;
  this.options = options;
  this.parser = parserInline;
  this.tokens = outTokens;
  this.pos = 0;
  this.posMax = this.src.length;
  this.posTextStart = 0; // Start pos of text token.
  this.level = 0;
  this.pending = '';
  this.pendingLevel = 0;

  this.cache = [];        // Stores { start: end } pairs. Useful for backtrack
                          // optimization of pairs parse (emphasis, strikes).

  // Link parser state vars

  this.isInLabel = false; // Set true when seek link label - we should disable
                          // "paired" rules (emphasis, strikes) to not skip
                          // tailing `]`

  this.linkLevel = 0;     // Increment for each nesting link. Used to prevent
                          // nesting in definitions

  this.linkContent = '';  // Temporary storage for link url

  this.labelUnmatchedScopes = 0; // Track unpaired `[` for link labels
                                 // (backtrack optimization)
}


// Flush pending text
//
StateInline.prototype.pushPending = function () {
  var pos, slice, trim, trimStart;
  pos = [ this.posTextStart, this.pos ];
  slice = this.src.slice(this.posTextStart, this.pos);
  trim = slice.replace(/\n/g, '').trim();
  trimStart = slice.indexOf(trim);
  this.tokens.push({
    type: 'text',
    content: this.pending,
    pos: [ pos[0] + trimStart, pos[1] - (slice.length - trim.length - trimStart) ],
    level: this.pendingLevel
  });
  this.pending = '';
  this.posTextBegin = this.pos;
};


// Push new token to "stream".
// If pending text exists - flush it as text token
//
StateInline.prototype.push = function (token) {
  var pos;
  if (token.pos && token.type !== 'text') {
    pos = this.pos;
    this.pos = token.pos[0];
  }

  if (this.pending) {
    this.pushPending();
  }

  if (token.pos && token.type !== 'text') {
    this.posTextStart = token.pos[1];
    this.pos = pos;
  } else {
    this.posTextStart = this.pos;
  }

  this.tokens.push(token);
  this.pendingLevel = this.level;
};


// Store value to cache.
// !!! Implementation has parser-specific optimizations
// !!! keys MUST be integer, >= 0; values MUST be integer, > 0
//
StateInline.prototype.cacheSet = function (key, val) {
  for (var i = this.cache.length; i <= key; i++) {
    this.cache.push(0);
  }

  this.cache[key] = val;
};


// Get cache value
//
StateInline.prototype.cacheGet = function (key) {
  return key < this.cache.length ? this.cache[key] : 0;
};


module.exports = StateInline;
