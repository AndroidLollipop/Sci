// named after Prelude from Haskell
const a = require("./astEval.js")
const t = require("./tokParse.js")
const setTimeoutArray = [] // mutating consts is fine, only assigning to them is forbidden
const setTimeoutShim = (fn, timeout) => {
    return setTimeoutArray.push(setTimeout(fn, timeout))-1
}
const clearTimeoutShim = (id) => setTimeoutArray[id] !== undefined ? clearTimeout(setTimeoutArray[id]) : undefined
const recurseDetectDictionary = {}
const flattenArray = (array) => {
    recurseDetectDictionary[array.runtimeID] = true
    var res = "["
    for (var i = 0; i < array.array.length; i++) {
        res += stringify(array.array[i], true)
        if (i < (array.array.length - 1)) {
            res += ", "
        }
    }
    recurseDetectDictionary[array.runtimeID] = undefined
    return res + "]"
}
const reconstituteObject = (object) => {
    if (object.object === undefined) {
        return "{OpaqueObject}"
    }
    recurseDetectDictionary[object.runtimeID] = true
    var res = "{"
    var keys = Object.keys(object.object)
    for (var i = 0; i < keys.length; i++) {
        res += keys[i]+": "+stringify(object.object[keys[i]], true)
        if (i < (keys.length - 1)) {
            res += ", "
        }
    }
    recurseDetectDictionary[object.runtimeID] = undefined
    return res + "}"
}
const stringify = (x, adornStrings = false) => {
    if (!x) {
        return "undefined"
    }
    else if (x.runtimeID !== undefined && recurseDetectDictionary[x.runtimeID] === true) {
        return "Recursive"
    }
    else if (adornStrings === true && x.type === "string") {
        return '"' + x.value + '"'
    }
    else if (x.printString !== undefined) {
        return x.printString
    }
    else if (x.value !== undefined) {
        return x.value+""
    }
    else if (x.type === "array") {
        return flattenArray(x)
    }
    else if (x.type === "object") {
        return reconstituteObject(x)
    }
    else if (x.type === "function") {
        return "Function"
    }
    else {
        return x.type+""
    }
}
var symbolID = 0
const Prelude = {
    print: {
        type: "function",
        parentScope: a.emptyScope(), // it's unnecessary to define parentScope, () => {} * 3 is fine, but whatever honestly
        parameters: { type: "parameter declaration", canonicalString: "(x)", // canonicalString is unnecessary, i'm including it to make builtins consistent with regular functions
            children: [{ type: "identifier", canonicalString: "x", children: []}] // canonicalString is necessary here as it defines the parameters for the builtin
        },
        body: {
            type: "function body",
            canonicalString: "{return EXTERNALCONSOLELOG(x)}",
            children: [{ type: "!!!BUILTIN", builtin: ([scopeGetter, scopeSetter, scopeDefiner]) => {
                var x = scopeGetter("x")
                console.log(stringify(x))
                return x
            }}]
        },
        protected: true
    },
    typeOf: {
        type: "function",
        parentScope: a.emptyScope(),
        parameters: { type: "parameter declaration", canonicalString: "(x)", // canonicalString is unnecessary, i'm including it to make builtins consistent with regular functions
            children: [{ type: "identifier", canonicalString: "x", children: []}] // canonicalString is necessary here as it defines the parameters for the builtin
        },
        body: {
            type: "function body",
            canonicalString: "{return RUNTIMETYPEOF(x)}",
            children: [{ type: "!!!BUILTIN", builtin: ([scopeGetter, scopeSetter, scopeDefiner]) => {
                var x = scopeGetter("x")
                return x !== undefined && x.type !== undefined ? { type: "string", value: x.type } : { type: "void" }
            }}]
        },
        protected: true
    },
    undefined: { type: "undefined", protected: true },
    void : { type: "void", protected: true },
    mathSin: {
        type: "function",
        parentScope: a.emptyScope(), // it's unnecessary to define parentScope, () => {} * 3 is fine, but whatever honestly
        parameters: { type: "parameter declaration", canonicalString: "(x)",
            children: [{ type: "identifier", canonicalString: "x", children: []}]
        },
        body: {
            type: "function body",
            canonicalString: "{return EXTERNALTRIGSIN(x)}",
            children: [{ type: "!!!BUILTIN", builtin: ([scopeGetter, scopeSetter, scopeDefiner]) => {
                var x = scopeGetter("x")
                return x !== undefined && x.type === "number" ? { type: "number", value: Math.sin(x.value) } : { type: "void" }
            }}]
        },
        protected: true
    },
    mathPi: {
        type: "number",
        value: Math.PI,
        protected: true
    },
    arrayLength: {
        type: "function",
        parentScope: a.emptyScope(), // it's unnecessary to define parentScope, () => {} * 3 is fine, but whatever honestly
        parameters: { type: "parameter declaration", canonicalString: "(x)",
            children: [{ type: "identifier", canonicalString: "x", children: []}]
        },
        body: {
            type: "function body",
            canonicalString: "{return ARRAYLENGTH(x)}",
            children: [{ type: "!!!BUILTIN", builtin: ([scopeGetter, scopeSetter, scopeDefiner]) => {
                var x = scopeGetter("x")
                return x !== undefined && x.type === "array" ? { type: "number", value: x.array.length } : { type: "void" }
            }}]
        },
        protected: true
    },
    arrayPush: {
        type: "function",
        parentScope: a.emptyScope(), // it's unnecessary to define parentScope, () => {} * 3 is fine, but whatever honestly
        parameters: { type: "parameter declaration", canonicalString: "(x,y)",
            children: [{ type: "identifier", canonicalString: "x", children: []}, { type: "identifier", canonicalString: "y", children: []}]
        },
        body: {
            type: "function body",
            canonicalString: "{return ARRAYPUSH(x,y)}",
            children: [{ type: "!!!BUILTIN", builtin: ([scopeGetter, scopeSetter, scopeDefiner]) => {
                var x = scopeGetter("x")
                var y = scopeGetter("y")
                return x !== undefined && x.type === "array" ? (x.array.push(y),y) : { type: "void" }
            }}]
        },
        protected: true
    },
    setTimeout: {
        type: "function",
        parentScope: a.emptyScope(),
        parameters: { type: "parameter declaration", canonicalString: "(x,y)",
            children: [{ type: "identifier", canonicalString: "x", children: []}, { type: "identifier", canonicalString: "y", children: []}]
        },
        body: {
            type: "function body",
            canonicalString: "{return EXTERNALSETTIMEOUT(x,y)}",
            children: [{ type: "!!!BUILTIN", builtin: ([scopeGetter, scopeSetter, scopeDefiner]) => {
                var x = scopeGetter("x")
                var y = scopeGetter("y")
                return x !== undefined && x.type === "function" && y !== undefined && y.type === "number" ? { type: "number", value: setTimeoutShim(() => a.evaluateExpression(x.parentScope)(x.body), y.value)} : { type: "void" }
            }}]
        },
        protected: true
    },
    clearTimeout: {
        type: "function",
        parentScope: a.emptyScope(),
        parameters: { type: "parameter declaration", canonicalString: "(x)",
            children: [{ type: "identifier", canonicalString: "x", children: []}]
        },
        body: {
            type: "function body",
            canonicalString: "{return EXTERNALCLEARTIMEOUT(x)}",
            children: [{ type: "!!!BUILTIN", builtin: ([scopeGetter, scopeSetter, scopeDefiner]) => {
                var x = scopeGetter("x")
                return x !== undefined && x.type === "number" ? (clearTimeoutShim(x.value), { type: "void" }) : { type: "void" }
            }}]
        },
        protected: true
    },
    stringify: {
        type: "function",
        parentScope: a.emptyScope(),
        parameters: { type: "parameter declaration", canonicalString: "(x)",
            children: [{ type: "identifier", canonicalString: "x", children: []}]
        },
        body: {
            type: "function body",
            canonicalString: "{return EXTERNALSTRINGIFY(x)}",
            children: [{ type: "!!!BUILTIN", builtin: ([scopeGetter, scopeSetter, scopeDefiner]) => {
                var x = scopeGetter("x")
                return { type: "string", value: stringify(x) }
            }}]
        },
        protected: true
    },
    parseFloat: {
        type: "function",
        parentScope: a.emptyScope(),
        parameters: { type: "parameter declaration", canonicalString: "(x)",
            children: [{ type: "identifier", canonicalString: "x", children: []}]
        },
        body: {
            type: "function body",
            canonicalString: "{return EXTERNALPARSEFLOAT(x)}",
            children: [{ type: "!!!BUILTIN", builtin: ([scopeGetter, scopeSetter, scopeDefiner]) => {
                var x = scopeGetter("x")
                if (x !== undefined && x.type === "string") {
                    var res = parseFloat(x.value)
                    if (res !== NaN) {
                        return { type: "number", value: res }
                    }
                }
                return { type: "void" }
            }}]
        },
        protected: true
    },
    parseInt: {
        type: "function",
        parentScope: a.emptyScope(),
        parameters: { type: "parameter declaration", canonicalString: "(x)",
            children: [{ type: "identifier", canonicalString: "x", children: []}]
        },
        body: {
            type: "function body",
            canonicalString: "{return EXTERNALPARSEINT(x)}",
            children: [{ type: "!!!BUILTIN", builtin: ([scopeGetter, scopeSetter, scopeDefiner]) => {
                var x = scopeGetter("x")
                if (x !== undefined && x.type === "string") {
                    var res = parseInt(x.value)
                    if (res !== NaN) {
                        return { type: "number", value: res }
                    }
                }
                return { type: "void" }
            }}]
        },
        protected: true
    },
    evalEmptyScope: {
        type: "function",
        parentScope: x => x,
        parameters: { type: "parameter declaration", canonicalString: "(x)",
            children: [{ type: "identifier", canonicalString: "x", children: []}]
        },
        body: ([scopeGetter, scopeSetter, scopeDefiner]) => ({
            type: "function body",
            canonicalString: "{evalInScope(x, getEmptyScope());}",
            children: [{"type":"function call","canonicalString":"evalInScope(x, getEmptyScope())","children":[{"type":"identifier","canonicalString":"evalInScope","children":[]},{"type":"function call bindings","canonicalString":"(x, getEmptyScope())","children":[{ type: "!!!BUILTIN", builtin: () => scopeGetter("x")},{"type":"function call","canonicalString":"getEmptyScope()","children":[{"type":"identifier","canonicalString":"getEmptyScope","children":[]},{"type":"function call bindings","canonicalString":"()","children":[]}]}]}]}]
        }),
        protected: true
    },
    evalCurrentScope: {
        type: "function",
        parentScope: x => x,
        parameters: { type: "parameter declaration", canonicalString: "(x)",
            children: [{ type: "identifier", canonicalString: "x", children: []}]
        },
        body: ([scopeGetter, scopeSetter, scopeDefiner]) => ({
            type: "function body",
            canonicalString: "{evalInScope(x, getCurrentScope());}",
            children: [{"type":"function call","canonicalString":"evalInScope(x, getCurrentScope())","children":[{"type":"identifier","canonicalString":"evalInScope","children":[]},{"type":"function call bindings","canonicalString":"(x, getCurrentScope())","children":[{ type: "!!!BUILTIN", builtin: () => scopeGetter("x")},{"type":"function call","canonicalString":"getCurrentScope()","children":[{"type":"identifier","canonicalString":"getCurrentScope","children":[]},{"type":"function call bindings","canonicalString":"()","children":[]}]}]}]}]
        }),
        protected: true
    },
    getCurrentScope: {
        type: "function",
        parentScope: x => x,
        parameters: { type: "parameter declaration", canonicalString: "()",
            children: []
        },
        body: () => ({
            type: "function body",
            canonicalString: "{return GETCURRENTSCOPE()}",
            children: [{ type: "!!!BUILTIN", builtin: (scope) => {
                return { type: "scope", scope: scope, value: "Scope" }
            }}]
        }),
        protected: true
    },
    getEmptyScope: {
        type: "function",
        parentScope: a.emptyScope(),
        parameters: { type: "parameter declaration", canonicalString: "(x)",
            children: [{ type: "identifier", canonicalString: "x", children: []}]
        },
        body: {
            type: "function body",
            canonicalString: "{return GETEMPTYSCOPE(x)}",
            children: [{ type: "!!!BUILTIN", builtin: (scope) => {
                const [scopeGetter, scopeSetter, scopeDefiner] = scope
                const x = scopeGetter("x")
                const retScope = (x !== undefined && x.type === "import") ? a.emptyScope(x.getter()) : a.emptyScope()
                return { type: "scope", scope: retScope, value: "Scope" }
            }}]
        },
        protected: true
    },
    prelude: {
        type: "import",
        getter: () => Prelude,
        value: "Import",
        protected: true
    },
    evalInScope: {
        type: "function",
        parentScope: a.emptyScope(),
        parameters: { type: "parameter declaration", canonicalString: "(x,y)",
            children: [{ type: "identifier", canonicalString: "x", children: []}, { type: "identifier", canonicalString: "y", children: []}]
        },
        body: {
            type: "function body",
            canonicalString: "{return INTERPRET(x,y)}",
            children: [{ type: "!!!BUILTIN", builtin: (scope) => {
                const [scopeGetter, scopeSetter, scopeDefiner] = scope
                const x = scopeGetter("x")
                const y = scopeGetter("y")
                if (x !== undefined && x.type === "string") {
                    const wrappedString = t.wrapString(x.value)
                    const parse = t.matchProgram(wrappedString)
                    if (parse.status === "success"){
                        if (y !== undefined && y.type === "scope") {
                            return a.evaluateExpression(y.scope)(parse.treeNode)
                        }
                    }
                }
                return { type: "void" }
            }}]
        },
        protected: true
    },
    adjoinScope: {
        type: "function",
        parentScope: a.emptyScope(),
        parameters: { type: "parameter declaration", canonicalString: "(x,y)",
            children: [{ type: "identifier", canonicalString: "x", children: []}, { type: "identifier", canonicalString: "y", children: []}]
        },
        body: {
            type: "function body",
            canonicalString: "{return ADJIONSCOPE(x,y)}",
            children: [{ type: "!!!BUILTIN", builtin: (scope) => {
                const [scopeGetter, scopeSetter, scopeDefiner] = scope
                const x = scopeGetter("x")
                const y = scopeGetter("y")
                if (x !== undefined && x.type === "scope" && y !== undefined && y.type === "scope") {
                    return { type: "scope", scope: a.adjoinScope(x.scope)(y.scope), value: "Scope" }
                }
                return { type: "void" }
            }}]
        },
        protected: true
    },
    Symbol: {
        type: "function",
        parentScope: a.emptyScope(),
        parameters: { type: "parameter declaration", canonicalString: "(x)",
            children: [{ type: "identifier", canonicalString: "x", children: []}]
        },
        body: {
            type: "function body",
            canonicalString: "{return GETSYMBOL(x)}",
            children: [{ type: "!!!BUILTIN", builtin: ([scopeGetter, scopeSetter, scopeDefiner]) => {
                const x = scopeGetter("x")
                const printString = 'Symbol("' + ((x !== undefined && x.type === "string") ? x.value : "") + '")'
                const ret = { type: "symbol", printString, value: symbolID }
                symbolID++
                return ret
            }}]
        }
    }
}
module.exports = {
    Prelude: Prelude
}