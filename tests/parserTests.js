const t = require("../tokParse.js")
const youClod = (x) => console.log(require("util").inspect(x, { showHidden: false, depth: null }))
const c = (s) => youClod(t.matchProgram(t.wrapString(s)))
c("1*(2+3)*4-5+6*7*9*3 == 3&&1-2*3+1==2||3!=1")
c("var slowFibonacci(n) { \
    if (n < 3) { \
        return 1 \
    } \
    return slowFibonacci(n-1)+slowFibonacci(n-2) \
} \
print(slowFibonacci(10)) \
var fastFibonacci(n) { \
    var a = 1 \
    var b = 1 \
    var c = 1 \
    while (n > 2) { \
        c = a+b \
        a = b \
        b = c \
        n = n-1 \
    } \
    return c \
} \
print(fastFibonacci(10)) \
print(mathSin(mathPi/6)) \
var closure(multiplier, start) { \
    var add() { \
        skye = skye + 1 \
        return skye*multiplier \
    } \
    var skye = start/multiplier-1 \
    return add \
} \
var clo = closure(1, 10) \
var ver = closure(2, 20) \
print(clo()) \
print(ver()) \
print(clo()) \
print(ver()) \
print(clo()) \
print(ver()) \
print('language runtime written by AndroidLollipop in the year') \
print(9*8*7*(6+5-4-3)+2*1) \
print('example program written by AndroidLollipop in the year') \
print((10+9)*(8+7+6)*5+4*3*2-1) \
print(typeOf(1)) \
print(typeOf(typeOf(1))) \
print(typeOf(typeOf)) \
var church(n) { \
    var a(f) { \
        var b(g) { \
            var i = 0 \
            while (i < n) { \
                g = f(g) \
                i = i + 1 \
            } \
            return g \
        } \
        return b \
    } \
    return a \
} \
var inc(n) { \
    return n+1 \
} \
print('for church numerals, application is exponentiation') \
print('church 5 applied to church 5 is church') \
print(church(5)(church(5))(inc)(0))")
c("let a = 1 \
let const = 1 \
let var = 1 \
let num = 1 \
let const a = 1 \
let const var = 1 \
let const num = 1 \
let var a = 1 \
let num a = 1 \
let const var a = 1 \
let const num a = 1")
c("if(true){}")