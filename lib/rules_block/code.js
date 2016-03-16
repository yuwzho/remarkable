// Code block (4 spaces padded)

'use strict';


module.exports = function code(state, startLine, endLine/*, silent*/) {
  var nextLine, last;

  if (state.tShift[startLine] - state.blkIndent < 4) { return false; }

  if (state.parentType === 'list' &&
      state.tokens[state.tokens.length - 1].type === 'list_item_open') {
       return false;
  }

  last = nextLine = startLine + 1;

  // we need extract something in code, may be the syntax is start the second line.
  // don't parse the latter line as code here for the extension's parse.
  // while (nextLine < endLine) {
  //   if (state.isEmpty(nextLine)) {
  //     nextLine++;
  //     continue;
  //   }
  //   if (state.tShift[nextLine] - state.blkIndent >= 4) {
  //     nextLine++;
  //     last = nextLine;
  //     continue;
  //   }
  //   break;
  // }

  state.line = nextLine;
  state.tokens.push({
    type: 'code',
    content: state.getLines(startLine, last, 4 + state.blkIndent, true),
    block: true,
    lines: [ startLine, state.line ],
    level: state.level
  });

  return true;
};
