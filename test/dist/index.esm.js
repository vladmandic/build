/*
  Build Test  
*/

// test/src/module.ts
async function call(msg) {
  console.log("inside module:", msg);
  return true;
}

// test/src/index.ts
async function idle() {
}
async function first(msg) {
  console.log("test", msg);
}
async function second() {
  call("test module");
}
first("message");
export {
  first,
  idle,
  second
};
//# sourceMappingURL=index.esm.js.map
