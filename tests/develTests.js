const e = require("../simpleAndCleanInterfaceForRepl.js")
const repl = e.getRepl() // sadly no support for += yet, it isn't hard to implement but isn't a priority right now
repl("var slowFibonacci(n) { \
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
print(church(5)(church(5))(inc)(0)) \
var k = [inc(1), inc(2), [inc(1),inc(2),inc(3)]] \
print(k[1]) \
k[2][1] = 4 \
print(k[2][1]) \
print(k[inc(1)][inc(1)]) \
print(arrayLength(k[2])) \
print(arrayLength(k)) \
print(arrayPush(k, 1)) \
print(k) \
var fun(n) { \
    var fun(m) { \
        return [n+m+1] \
    } \
    return [fun, fun(1)] \
} \
print(fun(1)[0](1)[0]) \
print(fun(1)[1]) \
print(false&&false==false) \
print(1==1&&false==true) \
print(1==1||false==true) \
print(1==1||false==true) \
print(true==1||false==true) \
print(1==1&&true==true) \
var t() { \
    print('hello. this is not a bug, this is setTimeout in action. though, if you see this printed twice, there is a bug in the interpreter.') \
} \
print(setTimeout(t, 100)) \
clearTimeout(setTimeout(t, 200)) \
print(parseFloat(stringify(201)+stringify(8.326))+1) \
print(parseInt(stringify(201)+stringify(8.326))+1) \
print([print, undefined, void]) \
print(print) \
print(stringify(print)) \
var u = print \
u = 1 \
print(u) \
var m \
var v(){ \
    m = while(u>0){u = u-1; return 1} \
} \
v() \
var k(){ \
    m \
    print('variables are not allowed to be traited') \
} \
k() \
m \
print(m) \
u = 1 \
print(while(u>0){u = u-1; return 1}) \
print('function parameters are variable assignments too and must therefore be untraited') \
u = print \
u = 1 \
var w = print \
w('no trait leakage') \
w = 1 \
print('no trait leakage 2: electric boogaloo') \
const var w = 1 \
const x = 1 \
print(w) \
print(x) \
print('const var is a bit of an oxymoron, but you know') \
const y(x) { \
    print(x) \
} \
y('sound. next line should be 1') \
const num z(x) { \
    print(x) \
} \
z(1) \
num aa = 1 \
num ab = 1 \
aa = ab = 2 \
print(aa) \
print(ab) \
aa = (ab = 1)+1 \
print(aa) \
print(ab) \
var aa = [0] \
aa[0] = (ab = 0)+1 \
print(aa) \
print(ab) \
print('sep') \
let a = 1 \
if (true) { \
    let a = 2 \
    print(a) \
} \
print(a) \
const a = 1 \
if (true) { \
    let a = 2 \
    print(a) \
} \
print(a) \
print('no showstoppers occurred')")
// operator precedence levels (you can find this in tokParse.js)
// level 4: * /
// level 3: + -
// level 2: > < >= <=
// level 1: == !=
// level 0: && ||