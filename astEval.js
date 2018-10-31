// see tokparse.js for ast definition
var truthy = (v) => v&&!!v.value // we can easily modify/extend this
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
    else if (op.canonicalString == "==") {
        if (p1.type == p2.type && p1.value != undefined) {
            return { type: "boolean", value: p1.value == p2.value }
        }
        return { type: "boolean", value: false }
    }
    else if (op.canonicalString == "!=") {
        if (p1.type == p2.type && p1.value != undefined) {
            return { type: "boolean", value: p1.value != p2.value }
        }
        return { type: "boolean", value: true } // i decided against combining this with == for clarity
    }
    else if (op.canonicalString == "&&") {
        if (truthy(p1) && truthy(p2)) {
            return { type: "boolean", value: true }
        }
        return { type: "boolean", value: false }
    }
    else if (op.canonicalString == "||") {
        if (truthy(p1) || truthy(p2)) {
            return { type: "boolean", value: true }
        }
        return { type: "boolean", value: false }
    }
    else if (op.canonicalString == "<") {
        if (p1.type == "number" && p2.type == "number" && p1.value < p2.value) {
            return { type: "boolean", value: true }
        }
        return { type: "boolean", value: false }
    }
    else if (op.canonicalString == ">") {
        if (p1.type == "number" && p2.type == "number" && p1.value > p2.value) {
            return { type: "boolean", value: true }
        }
        return { type: "boolean", value: false }
    }
    else if (op.canonicalString == "<=") {
        if (p1.type == "number" && p2.type == "number" && p1.value <= p2.value) {
            return { type: "boolean", value: true }
        }
        return { type: "boolean", value: false }
    }
    else if (op.canonicalString == ">=") {
        if (p1.type == "number" && p2.type == "number" && p1.value >= p2.value) {
            return { type: "boolean", value: true }
        }
        return { type: "boolean", value: false }
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
var defineInScope = (sco) => (identifiers) => ([scopeGetter, scopeSetter, scopeDefiner]) => (expressions) => {
    for (var i = 0; i < identifiers.children.length; i++) {
        if (expressions.children[i] == undefined) {
            return
        }
        scopeDefiner(identifiers.children[i].canonicalString, sco(expressions.children[i]))
    }
}
var collapseString = (nodeChildren) => {
    var ret = ""
    nodeChildren.map(x => x.type == "alphanumeric literal" ? ret += x.canonicalString: x.canonicalString == "\\" ? ret += "\\" : x.canonicalString == "n" ? ret += "\n" : ret += x.canonicalString)
    return ret
}
var typeMap = {
    num : "number",
    str: "string",
    bool: "boolean"
}
var evaluateExpression = (scc) => {
    var [scopeGetter, scopeSetter, scopeDefiner] = scc
    var sco = (expression) => {
        if (expression.type == "function declaration") {
            scopeDefiner(expression.children[1].canonicalString, { type: "function", parentScope: scc, parameters: expression.children.filter((x) => x.type == "parameter declaration")[0], body: expression.children.filter((x) => x.type == "function body")[0]})
            if (expression.children[0].type == "typed declaration") {
                scopeDefiner(".typeof" + expression.children[1].canonicalString, { type: "typecheck", value: expression.children[0].canonicalString}) // this is safe since identifiers cannot start with .
            }
            return scopeGetter(expression.children[1].canonicalString)
        }
        else if (expression.type == "!!!BUILTIN") {
            var res = expression.builtin(scc)
            return res
        }
        else if (expression.type == "if expression" || expression.type == "if else expression") {
            var res = truthy(sco(expression.children[0]))
            if (res == 1) {
                return sco(expression.children[1])
            }
            else if (res == 0 && expression.type == "if else expression") {
                return sco(expression.children[2])
            }
            return { type: "void" }
        }
        else if (expression.type == "while expression") {
            var res = truthy(sco(expression.children[0]))
            var ret = { type: "void" }
            while (res == 1) {
                ret = sco(expression.children[1])
                if (ret.type == "!!!INTERNAL INTERPRETER CONTROL") {
                    return ret
                }
                res = truthy(sco(expression.children[0]))
            }
            return ret
        }
        else if (expression.type == "function call") {
            var target = sco(expression.children[0])
            var typecheck = { type: "void" }
            if (expression.children[0].type == "identifier") {
                typecheck = scopeGetter(".typeof" + expression.children[0].canonicalString)
            }
            var targetScope = adjoinScope(target.parentScope)(emptyScope())
            defineInScope(sco)(target.parameters)(targetScope)(expression.children.filter((x) => x.type == "function call bindings")[0])
            var expRes = evaluateExpression(targetScope)(target.body)
            if (expRes.type !== "!!!INTERNAL INTERPRETER CONTROL" || expRes.control !== "return") { // someone is trying to trick us
                return { type: "void" }
            }
            if (typecheck.type == "typecheck" && expRes.value.type !== typeMap[typecheck.value]) {
                throw "TypeError: function call return type, " + expRes.value.type + " did not match declared type, " + typeMap[typecheck.value] + " for function " + expression.children[0].canonicalString
            }
            return expRes.value
        }
        else if (expression.type == "function body") {
            var expRes = { type: "void" }
            for (var i = 0; i < expression.children.length; i++) {
                expRes = sco(expression.children[i])
                if (expRes.type == "!!!INTERNAL INTERPRETER CONTROL") {
                    return expRes
                }
            }
            return { type: "!!!INTERNAL INTERPRETER CONTROL", control: "return", value: expRes } // functions implicitly return, only {} returns void
        }
        else if (expression.type == "block body") {
            var expRes = { type: "void" }
            for (var i = 0; i < expression.children.length; i++) {
                expRes = sco(expression.children[i])
                if (expRes.type == "!!!INTERNAL INTERPRETER CONTROL") {
                    return expRes
                }
            }
            return expRes
        }
        else if (expression.type == "return statement") {
            var expRes = sco(expression.children[0])
            return { type: "!!!INTERNAL INTERPRETER CONTROL", control: "return", value: expRes } // this could be a source of vulnerabilities, damn
        }
        else if (expression.type == "variable declaration") {
            var expRes = sco(expression.children[3])
            // to prevent the language spec from getting too insane, we restrict variable declarations to straight identifiers
            // e.g. num k[1] = 1 is not allowed
            if (expression.children[0].type == "typed declaration") {
                if (expRes.type !== typeMap[expression.children[0].canonicalString]) {
                    throw "TypeError: expression type, " + expRes.type + " did not match declared type, " + typeMap[expression.children[0].canonicalString] + " for variable " + expression.children[1].canonicalString
                }
                scopeDefiner(".typeof" + expression.children[1].canonicalString, { type: "typecheck", value: expression.children[0].canonicalString}) // this is safe since identifiers cannot start with .
            }
            scopeDefiner(expression.children[1].canonicalString, expRes)
            return expRes
        }
        else if (expression.type == "variable set") {
            var expRes = sco(expression.children[2])
            // the result is always computed first.
            // this is unlike javascript, where the array index is computed first (i tested this)
            // javascript test code:
            // [][console.log("index computed")] = console.log("value computed")
            // logs to console:
            // index computed
            // value computed
            if (expression.children[0].type == "array access") {
                var arrRes = sco(expression.children[0].children[0])
                if (arrRes.setter == undefined) {
                    return { type: "void" }
                }
                return arrRes.setter(sco(expression.children[0].children[1].children[0]), expRes)
            }
            else if (expression.children[0].type == "identifier") {
                var typecheck = scopeGetter(".typeof" + expression.children[0].canonicalString)
                if (typecheck.type == "typecheck" && expRes.type !== typeMap[typecheck.value]) {
                    throw "TypeError: expression type, " + expRes.type + " did not match declared type, " + typeMap[typecheck.value] + " for variable " + expression.children[0].canonicalString
                }
                scopeSetter(expression.children[0].canonicalString, expRes)
                return expRes
            }
            return { type: "void" } // someone tried to do something like 1 = 2
            // an interesting quirk is that 1 = print(1) would print something
            // but this is edge case behaviour and doesn't really matter
        }
        else if (expression.type == "array access") {
            var arrRes = sco(expression.children[0])
            if (arrRes.getter == undefined) {
                return { type: "void" }
            }
            return arrRes.getter(sco(expression.children[1].children[0]))
        }
        else if (expression.type == "parenthesized expression") {
            if (expression.children[0] == undefined) {
                return { type: "void" }
            }
            return unwrap(sco(expression.children[0]))
        }
        else if (expression.type == "expression") {
            if (expression.children[0] == undefined) {
                return { type: "void" }
            }
            var acc = unwrap(sco(expression.children[0]))
            for (var i = 1; i < expression.children.length; i+=2) {
                acc = operate(acc, expression.children[i], unwrap(sco(expression.children[i+1])))
            }
            return acc
        }
        else if (expression.type == "negated literal") {
            if (expression.children[0] == undefined) {
                return { type: "void" }
            }
            var expRes = sco(expression.children[0])
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
        else if (expression.type == "array literal") {
            var arr = []
            for (var i = 0; i < expression.children.length; i++) {
                arr.push(sco(expression.children[i]))
            }
            return { type: "array", array: arr, getter: (x) => arr[Math.round(Math.abs(x.value))] == undefined ? { type: "void" } : arr[Math.round(Math.abs(x.value))], setter: (x, v) => arr[Math.round(Math.abs(x.value))] = v }
            // void in place of undefined. we don't want to let people accidentally unset variables and leak into the parent scope
        }
        else if (expression.type == "boolean literal") {
            if (expression.canonicalString == "true") {
                return { type: "boolean", value: true }
            }
            return { type: "boolean", value: true }
        }
        else if (expression.type == "identifier") {
            return scopeGetter(expression.canonicalString)
        }
        return { type: "void" }
    }
    return sco
}
module.exports = {
    evaluateExpression: evaluateExpression,
    emptyScope: emptyScope,
    adjoinScope: adjoinScope
}