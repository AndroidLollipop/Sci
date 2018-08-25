// named after Prelude from Haskell
var a = require("./astEval.js")
var Prelude = {
    print: {
        type: "function",
        parentScope: a.emptyScope(), // it is unnecessary to define parentScope, () => {} * 3 is fine, but whatever honestly
        parameters: { type: "parameter declaration", canonicalString: '(x)', // canonicalString is unnecessary, i'm including it to make builtins consistent with regular functions
            children: [{ type: "identifier", canonicalString: "x", children: []}] // canonicalString is necessary here as it defines the parameters for the builtin
        },
        body: {
            type: "function body",
            canonicalString: "{return EXTERNALCONSOLELOG(x)}",
            children: [{ type: "!!!BUILTIN", builtin: ([scopeGetter, scopeSetter, scopeDefiner]) => {
                var x = scopeGetter("x")
                x !== undefined ? (x.value !== undefined ? console.log(x.value) : undefined) : undefined
                return x
            }}]
        }
    },
    mathSin: {
        type: "function",
        parentScope: a.emptyScope(), // it is unnecessary to define parentScope, () => {} * 3 is fine, but whatever honestly
        parameters: { type: "parameter declaration", canonicalString: '(x)',
            children: [{ type: "identifier", canonicalString: "x", children: []}]
        },
        body: {
            type: "function body",
            canonicalString: "{return EXTERNALTRIGSIN(x)}",
            children: [{ type: "!!!BUILTIN", builtin: ([scopeGetter, scopeSetter, scopeDefiner]) => {
                var x = scopeGetter("x")
                var v = { type: "void" }
                return x !== undefined ? (x.type == "number" ? { type: "number", value: Math.sin(x.value) } : v) : v 
            }}]
        }
    }
}
module.exports = {
    Prelude: Prelude
}