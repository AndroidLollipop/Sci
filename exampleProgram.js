var e = require("./simpleAndCleanInterfaceForRepl.js")
var repl = e.getRepl()
repl("num slowFibonacci(n){ \
    if (n < 3) { \
        return 1 \
    } \
    return slowFibonacci(n-1)+slowFibonacci(n-2) \
} \
print(slowFibonacci(10)) \
num fastFibonacci(n){num a = 1 \
    num b = 1 \
    num c = 1 \
    while (n>2) { \
        c = a+b \
        a = b \
        b = c \
        n = n-1 \
    } \
    return c \
} \
print(fastFibonacci(10)) \
num pi = 3.1415926535 \
print(mathSin(pi/6)) \
num closure(multiplier, start){ \
    num add(){skye = skye + 1 \
        return skye*multiplier \
    } \
    num skye = start/multiplier-1 \
    return add \
} \
num clo = closure(1, 10) \
num ver = closure(2, 20) \
print(clo()) \
print(ver()) \
print(clo()) \
print(ver()) \
print(clo()) \
print(ver())")