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
print(fastFibonacci(10))")