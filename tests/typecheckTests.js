var e = require("../simpleAndCleanInterfaceForRepl.js")
var repl = e.getRepl() // sadly no support for += yet, it isn't hard to implement but isn't a priority right now
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
if (passed == 1) {
    console.log("typecheck test PASSED!")
}
else {
    console.log("typecheck test FAILED!")
}