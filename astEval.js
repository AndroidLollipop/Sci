// see tokparse.js for ast definition
var operate = (p1, op, p2) => {
    if (op.canonicalString == "+") {
        if (p1.type == p2.type) {
            return { type: p1.type, value: p1.value + p2.value }
        }
    }
    else if (op.canonicalString == "-") {
        if (p1.type == p2.type) {
            return { type: p1.type, value: p1.value - p2.value }
        }
    }
    else if (op.canonicalString == "*") {
        if (p1.type == p2.type) {
            return { type: p1.type, value: p1.value * p2.value }
        }
    }
    else if (op.canonicalString == "/") {
        if (p1.type == p2.type) {
            return { type: p1.type, value: p1.value / p2.value }
        }
    }
    return { type: "void" }
}
var unwrap = (typ) => {
    while (typ.type == "!!!INTERNAL INTERPRETER CONTROL") {
        typ = typ.value
    }
    return typ
}
var emptyScope = (predict) => { // i know, predict is a fitting name
    var scopeDict = predict !== undefined ? predict : {}
    return ([(name) => scopeDict[name] !== undefined ? scopeDict[name] : { type: "undefined" }, (name, value) => scopeDict[name] = value, (name, value) => scopeDict[name] = value])
}
var adjoinScope = ([scopeGetter, scopeSetter, scopeDefiner]) => ([newScopeGetter, newScopeSetter, newScopeDefiner]) => {
    return ([(name) => {
        if (newScopeGetter(name).type == "undefined") {
            return scopeGetter(name)
        }
        return newScopeGetter(name)
    }, (name, value) => {
        if (newScopeGetter(name).type == "undefined") {
            return scopeSetter(name, value)
        }
        return newScopeSetter(name, value)
    }, newScopeDefiner])
} // i imagine this is how scope is implemented in javascript, and that explains why setting an undeclared variable makes it global
var defineInScope = ([parentScopeGetter, parentScopeSetter, parentScopeDefiner]) => (identifiers) => ([scopeGetter, scopeSetter, scopeDefiner]) => (expressions) => {
    for (var i = 0; i < identifiers.children.length; i++) {
        if (expressions.children[i] == undefined) {
            return
        }
        scopeDefiner(identifiers.children[i].canonicalString, evaluateExpression([parentScopeGetter, parentScopeSetter, parentScopeDefiner])(expressions.children[i]))
    }
}
var collapseString = (nodeChildren) => {
    var ret = ""
    nodeChildren.map(x => x.type == "alphanumeric literal" ? ret += x.canonicalString: x.canonicalString == "\\" ? ret += "\\" : x.canonicalString == "n" ? ret += "\n" : ret += x.canonicalString)
    return ret
}
var evaluateCondition = ([scopeGetter, scopeSetter, scopeDefiner]) => ([L, C, R]) => {
    L = evaluateExpression([scopeGetter, scopeSetter, scopeDefiner])(L)
    R = evaluateExpression([scopeGetter, scopeSetter, scopeDefiner])(R)
    C = C.canonicalString
    if (L.type !== "number" || R.type !== "number") {
        return -1
    }
    L = L.value
    R = R.value
    if (C == "==" && L == R) {
        return 1
    }
    if (C == ">" && L > R) {
        return 1
    }
    if (C == "<" && L < R) {
        return 1
    }
    return 0
}
var evaluateExpression = ([scopeGetter, scopeSetter, scopeDefiner]) => (expression) => {
    if (expression.type == "function declaration") {
        scopeDefiner(expression.children.filter((x) => x.type == "identifier")[0].canonicalString, { type: "function", parentScope: [scopeGetter, scopeSetter, scopeDefiner], parameters: expression.children.filter((x) => x.type == "parameter declaration")[0], body: expression.children.filter((x) => x.type == "function body")[0]})
        return scopeGetter(expression.children.filter((x) => x.type == "identifier")[0].canonicalString)
    }
    else if (expression.type == "if expression" || expression.type == "if else expression") {
        var res = evaluateCondition([scopeGetter, scopeSetter, scopeDefiner])(expression.children[0].children)
        if (res == 1) {
            return evaluateExpression([scopeGetter, scopeSetter, scopeDefiner])(expression.children[1])
        }
        else if (res == 0 && expression.type == "if else expression") {
            return evaluateExpression([scopeGetter, scopeSetter, scopeDefiner])(expression.children[2])
        }
        return { type: "void" }
    }
    else if (expression.type == "while expression") {
        var res = evaluateCondition([scopeGetter, scopeSetter, scopeDefiner])(expression.children[0].children)
        var ret = { type: "void" }
        while (res == 1) {
            ret = evaluateExpression([scopeGetter, scopeSetter, scopeDefiner])(expression.children[1])
            if (ret.type == "!!!INTERNAL INTERPRETER CONTROL") {
                return ret
            }
            res = evaluateCondition([scopeGetter, scopeSetter, scopeDefiner])(expression.children[0].children)
        }
        return ret
    }
    else if (expression.type == "function call") {
        var target = scopeGetter(expression.children.filter((x) => x.type == "identifier")[0].canonicalString)
        var targetScope = adjoinScope(target.parentScope)(emptyScope())
        defineInScope([scopeGetter, scopeSetter, scopeDefiner])(target.parameters)(targetScope)(expression.children.filter((x) => x.type == "function call bindings")[0])
        var expRes = evaluateExpression(targetScope)(target.body)
        if (expRes.type !== "!!!INTERNAL INTERPRETER CONTROL" || expRes.control !== "return") { // someone is trying to trick us
            return { type: "void" }
        }
        return expRes.value
    }
    else if (expression.type == "function body") {
        var expRes = { type: "void" }
        for (var i = 0; i < expression.children.length; i++) {
            expRes = evaluateExpression([scopeGetter, scopeSetter, scopeDefiner])(expression.children[i])
            if (expRes.type == "!!!INTERNAL INTERPRETER CONTROL") {
                return expRes
            }
        }
        return { type: "!!!INTERNAL INTERPRETER CONTROL", control: "return", value: expRes } // functions implicitly return, only {} returns void
    }
    else if (expression.type == "block body") {
        var expRes = { type: "void" }
        for (var i = 0; i < expression.children.length; i++) {
            expRes = evaluateExpression([scopeGetter, scopeSetter, scopeDefiner])(expression.children[i])
            if (expRes.type == "!!!INTERNAL INTERPRETER CONTROL") {
                return expRes
            }
        }
        return expRes
    }
    else if (expression.type == "return statement") {
        var expRes = evaluateExpression([scopeGetter, scopeSetter, scopeDefiner])(expression.children[0])
        return { type: "!!!INTERNAL INTERPRETER CONTROL", control: "return", value: expRes } // this could be a source of vulnerabilities, damn
    }
    else if (expression.type == "variable declaration") {
        var expRes = evaluateExpression([scopeGetter, scopeSetter, scopeDefiner])(expression.children[3])
        scopeDefiner(expression.children.filter((x) => x.type == "identifier")[0].canonicalString, expRes)
        return expRes
    }
    else if (expression.type == "variable set") {
        var expRes = evaluateExpression([scopeGetter, scopeSetter, scopeDefiner])(expression.children[2])
        scopeSetter(expression.children.filter((x) => x.type == "identifier")[0].canonicalString, expRes)
        return expRes
    }
    else if (expression.type == "parenthesized expression") {
        if (expression.children[0] == undefined) {
            return { type: "void" }
        }
        return unwrap(evaluateExpression([scopeGetter, scopeSetter, scopeDefiner])(expression.children[0]))
    }
    else if (expression.type == "expression") {
        if (expression.children[0] == undefined) {
            return { type: "void" }
        }
        var acc = unwrap(evaluateExpression([scopeGetter, scopeSetter, scopeDefiner])(expression.children[0]))
        for (var i = 1; i < expression.children.length; i+=2) {
            acc = operate(acc, expression.children[i], unwrap(evaluateExpression([scopeGetter, scopeSetter, scopeDefiner])(expression.children[i+1])))
        }
        return acc
    }
    else if (expression.type == "negated literal") {
        if (expression.children[0] == undefined) {
            return { type: "void" }
        }
        var expRes = evaluateExpression([scopeGetter, scopeSetter, scopeDefiner])(expression.children[0])
        if (expRes.type !== "number") {
            return { type: "void" }
        }
        return { type: "number", value: -expRes.value }
    }
    else if (expression.type == "float literal") {
        return { type: "number", value: parseFloat(expression.canonicalString) } // technically i'm not supposed to do this
    }
    else if (expression.type == "integral literal") {
        return { type: "number", value: parseInt(expression.canonicalString) }
    }
    else if (expression.type == "string literal") {
        return { type: "string", value: collapseString(expression.children) }
    }
    else if (expression.type == "identifier") {
        return scopeGetter(expression.canonicalString)
    }
    return { type: "void" }
}
module.exports = {
    evaluateExpression: evaluateExpression,
    emptyScope: emptyScope,
    adjoinScope: adjoinScope
}