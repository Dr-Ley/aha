"use strict";

// Windows briefly locks files under .next while Defender or the editor
// touches them. Node reports that as EBUSY. Retry the open before failing.
if (process.platform !== "win32") return;

const fs = require("fs");

function pause(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function locked(error) {
  return error && (error.code === "EBUSY" || error.code === "EPERM");
}

function retrySync(original, args) {
  let last;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      return original.apply(fs, args);
    } catch (error) {
      last = error;
      if (!locked(error)) throw error;
      pause(40 * (attempt + 1));
    }
  }
  throw last;
}

async function retryAsync(original, args) {
  let last;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      return await original.apply(fs.promises, args);
    } catch (error) {
      last = error;
      if (!locked(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 40 * (attempt + 1)));
    }
  }
  throw last;
}

for (const name of ["openSync", "writeFileSync", "appendFileSync", "renameSync", "unlinkSync", "rmSync"]) {
  const original = fs[name];
  if (typeof original !== "function") continue;
  fs[name] = function patched(...args) {
    return retrySync(original, args);
  };
}

for (const name of ["open", "writeFile", "appendFile", "rename", "unlink", "rm"]) {
  const original = fs.promises[name];
  if (typeof original !== "function") continue;
  fs.promises[name] = function patched(...args) {
    return retryAsync(original, args);
  };
}

function retryCallback(original, args) {
  const callback = args[args.length - 1];
  if (typeof callback !== "function") return original.apply(fs, args);
  const rest = args.slice(0, -1);
  let attempt = 0;
  function run() {
    original.apply(fs, [
      ...rest,
      (error, ...results) => {
        if (locked(error) && attempt < 12) {
          attempt += 1;
          setTimeout(run, 40 * attempt);
          return;
        }
        callback(error, ...results);
      },
    ]);
  }
  run();
}

for (const name of ["open", "writeFile", "appendFile", "rename", "unlink", "rm"]) {
  const original = fs[name];
  if (typeof original !== "function") continue;
  fs[name] = function patched(...args) {
    return retryCallback(original, args);
  };
}
