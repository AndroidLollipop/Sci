// named after Prelude from Haskell
var a = require("./astEval.js")
var Prelude = {
    print: {
        type: "function",
        parentScope: a.emptyScope(), // it is unnecessary to define parentScope, () => {} * 3 is fine, but whatever honestly
        parameters: { type: "parameter declaration", canonicalString: '(x)',
            children: [{ type: "identifier", canonicalString: "x", children: []}]
        },
        body: {
            type: "function body",
            canonicalString: "EXTERNALCONSOLELOG(x)",
            children: [{ type: "!!!BUILTIN", builtin: ([scopeGetter, scopeSetter, scopeDefiner]) => {
                var x = scopeGetter("x")
                x !== undefined ? (x.value !== undefined ? console.log(x.value) : undefined) : undefined
                return x
            }}]
        }
    }
}
module.exports = {
    Prelude: Prelude
}