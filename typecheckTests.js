var e = require("./simpleAndCleanInterfaceForRepl.js")
var repl = e.getRepl() // sadly no support for += yet, it isn't hard to implement but isn't a priority right now
try{
    repl("var inc(x) { \
        return x+1 \
    } \
    str k = inc(1)") // this should fail since return type of inc is num
}
catch(e) {
    console.log(e)
}
try{
    repl("num k = ' '") // this should fail since type of ' ' is str
}
catch(e) {
    console.log(e)
}
try {
    repl("str k = 5") // this should fail since type of 5 is num
}
catch(e) {
    console.log(e)
}
try {
    repl("str inc(x) { \
        return x+1 \
    } \
    inc(1)") // this should fail since return type of inc is num
}
catch(e) {
    console.log(e)
}
try {
    repl("arr = [1, 2] \
    str k = arr[1]") // this should fail since type of arr[1] is num
}
catch(e) {
    console.log(e)
}