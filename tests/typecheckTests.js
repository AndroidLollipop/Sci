const e = require("../simpleAndCleanInterfaceForRepl.js")
const repl = e.getRepl() // sadly no support for += yet, it isn't hard to implement but isn't a priority right now
var passed = 1
try {
    repl("var inc(x) { \
        return x+1 \
    } \
    str k = inc(1)") // this should fail since return type of inc is num
    passed = 0
}
catch(e) {
    console.log(e)
}
try {
    repl("num k = ' '") // this should fail since type of ' ' is str
    passed = 0
}
catch(e) {
    console.log(e)
}
try {
    repl("str k = 5") // this should fail since type of 5 is num
    passed = 0
}
catch(e) {
    console.log(e)
}
try {
    repl("str inc(x) { \
        return x+1 \
    } \
    inc(1)") // this should fail since return type of inc is num
    passed = 0
}
catch(e) {
    console.log(e)
}
try {
    repl("var arr = [1, 2] \
    str k = arr[1]") // this should fail since type of arr[1] is num
    passed = 0
}
catch(e) {
    console.log(e)
}
try {
    repl("var arr = [1, 2] \
    str k = ' ' \
    k = arr[1]") // this should fail since type of arr[1] is num
    passed = 0
}
catch(e) {
    console.log(e)
}
try {
    repl("var arr = [1, 2] \
    bool k = true \
    k = arr[1]") // this should fail since type of arr[1] is num
    passed = 0
}
catch(e) {
    console.log(e)
}
try {
    repl("const arr = [] \
    arr = 2") // this should fail since trait of arr is const
    passed = 0
}
catch(e) {
    console.log(e)
}
try {
    repl("const fun(x) { \
        print(x) \
    } \
    const num fun = 2") // this should fail since trait of fun is const
    passed = 0
}
catch(e) {
    console.log(e)
}
try {
    repl("const num inc = 1 \
    const num inc(x) { \
        return x+1 \
    }") // this should fail since trait of inc is const
    passed = 0
}
catch(e) {
    console.log(e)
}
try {
    repl("arr = 1") // this should fail since trait of arr is const (from previous repl in same scope)
    passed = 0
}
catch(e) {
    console.log(e)
}
try {
    repl("fun = 1") // this should fail since trait of fun is const (from previous repl in same scope)
    passed = 0
}
catch(e) {
    console.log(e)
}
try {
    repl("inc = 1") // this should fail since trait of inc is const (from previous repl in same scope)
    passed = 0
}
catch(e) {
    console.log(e)
}
try {
    repl("let const l = 1 \
if (true) { \
    l = 2 \
}") // this should fail since trait of l is const
    passed = 0
}
catch(e) {
    console.log(e)
}
try {
    repl("if (true) { \
    const m = 2 \
} \
m = 1") // this should fail since trait of m is const
    passed = 0
}
catch(e) {
    console.log(e)
}
try {
    repl("if (true) { \
    let const n = 2 \
    if (true) { \
        n = 3 \
    } \
}") // this should fail since trait of n is const
    passed = 0
}
catch(e) {
    console.log(e)
}
if (passed == 1) {
    console.log("typecheck test PASSED!")
}
else {
    console.log("typecheck test FAILED!")
}