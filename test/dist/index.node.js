/*
  Build Test  
*/

var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// test/src/index.ts
__export(exports, {
  first: () => first,
  idle: () => idle,
  second: () => second
});

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  first,
  idle,
  second
});
//# sourceMappingURL=index.node.js.map
