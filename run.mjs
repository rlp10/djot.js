import { EventParser } from "./block.js";
import { parse } from "./ast.js";
import fs from "fs";
import { performance } from "perf_hooks";

const warn = function(msg, pos) {
  process.stderr.write(msg + (pos ? " at " + pos : "") + "\n");
}

let timing = false;
let events = false;
let options = {sourcePositions: false, warn: warn};
let usage = `node ./run.mjs [OPTIONS] FILE*

Options:
  --sourcepos,-p       Include source positions
  --quiet,-q           Suppress warnings
  --time,-t            Print parse time to stderr
  --events,-e          Print events instead of AST
  --help,-h            This usage message
`;
let files = [];

for (let i=2; i < process.argv.length; i++) {
  let arg = process.argv[i];
  switch (arg) {
    case "--sourcepos":
    case "-p":
      options.sourcePositions = true;
      break;
    case "--quiet":
    case "-q":
      options.warn = (msg, pos) => {};
      break;
    case "--time":
    case "-t":
      timing = true;
      break;
    case "--events":
    case "-e":
      events = true;
      break;
    case "--help":
    case "-h":
      process.stdout.write(usage);
      process.exit(0);
      break;
    default:
      if (arg.charAt(0) === "-") {
        process.stderr.write("Unknown option " + arg + "\n");
        process.exit(1);
      } else {
        files.push(arg);
      }
  }
}

let input = "";
if (files.length === 0) {
  files = ["/dev/stdin"];
}
files.forEach(file => {
  input = input + fs.readFileSync(file, "utf8");
});

try {
  if (events) {
    let start = true;
    for (const event of new EventParser(input, warn)) {
      let pref;
      if (start) {
        pref = "[";
        start = false;
      } else {
        pref = ",";
      }
      process.stdout.write(pref + '["' + event.annot + '",' + event.startpos +
                             ',' + event.endpos + ']\n');
    }
    console.log("]");
  } else {
    let startTime = performance.now();
    let ast = parse(input, {sourcePositions: true});
    let endTime = performance.now();
    let parseTime = (endTime - startTime).toFixed(2);

    process.stdout.write(JSON.stringify(ast, null, 2));
    process.stdout.write("\n");
    if (timing) {
      process.stderr.write(`Parse time = ${parseTime} ms\n`);
    }
  }
} catch(err) {
    console.log(err + "\n");
    if (err.stack) {
      console.log(err.stack.split("\n"));
    }
    process.exit(1);
}


process.exit(0);
