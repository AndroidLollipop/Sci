// see tokparse.js for ast definition
const asscLeft = 0
const asscRight = 1 // maybe i should split these into a constants file
const truthy = (v) => v&&!!v.value // we can easily modify/extend this
const asscLeftOperate = (sco, scc) => (p1, op, p2) => {
    p2 = unwrap(sco(p2))
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
const asscRightOperate = (sco, scc) => (p1, op, p2) => {
    const [scopeGetter, scopeSetter, scopeDefiner] = scc
    if (op.canonicalString == "=") {
        const expRes = p2 // for clarity (and to ensure that the comments make sense)
        if (p1.type == "array access") {
            const arrRes = sco(p1.children[0])
            if (arrRes.setter == undefined) {
                return { type: "void" }
            }
            arrRes.setter(sco(p1.children[1].children[0]), unattr(expRes))
            return expRes // we need to return traited expRes
        }
        else if (p1.type == "identifier") {
            const typecheck = scopeGetter(".typeof" + p1.canonicalString)
            if (typecheck.type == "typecheck" && expRes.type !== typeMap[typecheck.value] && typecheck.value !== "any") {
                throw "TypeError: expression type, " + expRes.type + " did not match declared type, " + typeMap[typecheck.value] + " for variable " + p1.canonicalString
            }
            scopeSetter(p1.canonicalString, unattr(expRes))
            return expRes
        }
        return { type: "void" } // someone tried to do something like 1 = 2
        // an interesting quirk is that 1 = print(1) would print something
        // but this is edge case behaviour and doesn't really matter
    }
    return { type: "void" }
}
const unwrap = (typ) => {
    while (typ.type == "!!!INTERNAL INTERPRETER CONTROL") {
        typ = typ.value
    }
    return typ
}
const unattr = (typ) => {
    var res = Object.assign({}, unwrap(typ))
    delete res.protected
    return res
}
const setpro = (typ) => {
    var res = Object.assign({}, unwrap(typ))
    res.protected = true
    return res
}
const emptyScope = (predict) => { // i know, predict is a fitting name
    var scopeDict = predict !== undefined ? predict : {}
    return ([(name) => scopeDict[name] !== undefined ? scopeDict[name] : { type: "undefined" }, (name, value) => scopeDict[name] == undefined || scopeDict[name].protected !== true ? scopeDict[name] = value : (()=>{throw "TypeError: attempted reassignment of constant " + name})(), (name, value) => scopeDict[name] == undefined || scopeDict[name].protected !== true ? scopeDict[name] = value : (()=>{throw "TypeError: attempted reassignment of constant " + name})(), (name, value) => scopeDict[name] == undefined || scopeDict[name].protected !== true ? scopeDict[name] = value : (()=>{throw "TypeError: attempted reassignment of constant " + name})()])
}
const emptyBlock = (predict) => {
    var blockDict = predict !== undefined ? predict : {}
    return ([(name) => blockDict[name] !== undefined ? blockDict[name] : { type: "undefined" }, (name, value) => blockDict[name] == undefined || blockDict[name].protected !== true ? blockDict[name] = value : (()=>{throw "TypeError: attempted reassignment of constant " + name})()])
}
const adjoinScope = ([scopeGetter, scopeSetter, scopeDefiner, blockSefiner]) => ([newScopeGetter, newScopeSetter, newScopeDefiner, newBlockSefiner]) => {
    return ([(name) => {
        if (newScopeGetter(name).type == "undefined") {
            return scopeGetter(name)
        }
        return newScopeGetter(name)
    }, (name, value) => {
        var res = newScopeGetter(name)
        if (res.protected == true) {
            throw "TypeError: attempted reassignment of constant " + name
        } // not required for protected prelude (like protected define for non-global scopes), but good to have for future implementation of consts
        if (res.type == "undefined") {
            return scopeSetter(name, value)
        }
        return newScopeSetter(name, value)
    }, newScopeDefiner, newBlockSefiner])
} // i imagine this is how scope is implemented in javascript, and that explains why setting an undeclared variable makes it global
const adjoinBlock = ([scopeGetter, scopeSetter, scopeDefiner, blockSefiner]) => ([newBlockGetter, newBlockSefiner]) => {
    return ([(name) => {
        if (newBlockGetter(name).type == "undefined") {
            return scopeGetter(name)
        }
        return newBlockGetter(name)
    }, (name, value) => {
        var res = newBlockGetter(name)
        if (res.protected == true) {
            throw "TypeError: attempted reassignment of constant " + name
        }
        if (res.type == "undefined") {
            return scopeSetter(name, value)
        }
        return newBlockSefiner(name, value)
    }, scopeDefiner, newBlockSefiner])
}
const defineInScope = (sco) => (identifiers) => ([scopeGetter, scopeSetter, scopeDefiner]) => (expressions) => {
    for (var i = 0; i < identifiers.children.length; i++) {
        if (expressions.children[i] == undefined) {
            return
        }
        scopeDefiner(identifiers.children[i].canonicalString, unattr(sco(expressions.children[i])))
    }
}
const collapseString = (nodeChildren) => {
    var ret = ""
    nodeChildren.map(x => x.type == "alphanumeric literal" ? ret += x.canonicalString: x.canonicalString == "\\" ? ret += "\\" : x.canonicalString == "n" ? ret += "\n" : ret += x.canonicalString)
    return ret
}
const typeMap = {
    num : "number",
    str: "string",
    bool: "boolean"
}
const evaluateExpression = (scc) => {
    const [scopeGetter, scopeSetter, scopeDefiner, blockSefiner] = scc
    const sco = (expression) => {
        if (expression.type == "function declaration") {
            const definer = expression.children[0].children && expression.children[0].children[1] && expression.children[0].children[1].type == "block declaration" ? blockSefiner : scopeDefiner
            const expRes = { type: "function", parentScope: scc, parameters: expression.children.filter((x) => x.type == "parameter declaration")[0], body: expression.children.filter((x) => x.type == "function body")[0]}
            if (expression.children[0].children && expression.children[0].children[0] && expression.children[0].children[0].type == "constant declaration") {
                expRes.protected = true
            }
            definer(expression.children[1].canonicalString, expRes)
            if (expression.children[0].type == "typed declaration") {
                definer(".typeof" + expression.children[1].canonicalString, { type: "typecheck", value: expression.children[0].declaredType}) // this is safe since identifiers cannot start with .
            }
            else {
                definer(".typeof" + expression.children[1].canonicalString, { type: "typecheck", value: "any"})
            }
            return scopeGetter(expression.children[1].canonicalString)
        }
        else if (expression.type == "!!!BUILTIN") {
            const res = expression.builtin(scc)
            return res
        }
        else if (expression.type == "if expression" || expression.type == "if else expression") {
            const res = truthy(sco(expression.children[0]))
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
            const target = sco(expression.children[0])
            var typecheck = { type: "void" }
            if (expression.children[0].type == "identifier") {
                typecheck = scopeGetter(".typeof" + expression.children[0].canonicalString)
            }
            const isMacro = typeof target.parentScope === "function"
            const targetScope = isMacro ? target.parentScope(scc) : adjoinScope(target.parentScope)(emptyScope())
            const macroParams = isMacro ? emptyScope() : undefined
            defineInScope(sco)(target.parameters)(isMacro ? macroParams : targetScope)(expression.children.filter((x) => x.type == "function call bindings")[0])
            const expRes = evaluateExpression(targetScope)(isMacro ? target.body(macroParams) : target.body)
            if (expRes.type !== "!!!INTERNAL INTERPRETER CONTROL" || expRes.control !== "return") { // someone is trying to trick us
                return { type: "void" }
            }
            if (typecheck.type == "typecheck" && expRes.value.type !== typeMap[typecheck.value] && typecheck.value !== "any") {
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
            const targetScope = adjoinBlock(scc)(emptyBlock())
            const nco = evaluateExpression(targetScope)
            for (var i = 0; i < expression.children.length; i++) {
                expRes = nco(expression.children[i])
                if (expRes.type == "!!!INTERNAL INTERPRETER CONTROL") {
                    return expRes
                }
            }
            return expRes
        }
        else if (expression.type == "return statement") {
            const expRes = sco(expression.children[0])
            return { type: "!!!INTERNAL INTERPRETER CONTROL", control: "return", value: expRes } // this could be a source of vulnerabilities, damn
        }
        else if (expression.type == "variable declaration") {
            const definer = expression.children[0].children && expression.children[0].children[1] && expression.children[0].children[1].type == "block declaration" ? blockSefiner : scopeDefiner
            const expRes = sco(expression.children[3])
            const protected = expression.children[0].children && expression.children[0].children[0] && expression.children[0].children[0].type == "constant declaration"
            // to prevent the language spec from getting too insane, we restrict variable declarations to straight identifiers
            // e.g. num k[1] = 1 is not allowed
            if (expression.children[0].type == "typed declaration") {
                if (expRes.type !== typeMap[expression.children[0].declaredType]) {
                    throw "TypeError: expression type, " + expRes.type + " did not match declared type, " + typeMap[expression.children[0].declaredType] + " for variable " + expression.children[1].canonicalString
                }
                // we don't use unattr in scopeSetter/scopeDefiner to allow us to implement consts nicely
                definer(expression.children[1].canonicalString, protected ? setpro(expRes): unattr(expRes)) // this is fine since scopeDefiner checks for protection and doesn't blindly return the second parameter
                definer(".typeof" + expression.children[1].canonicalString, { type: "typecheck", value: expression.children[0].declaredType}) // this is safe since identifiers cannot start with .
            }
            else {
                definer(expression.children[1].canonicalString, protected ? setpro(expRes): unattr(expRes))
                definer(".typeof" + expression.children[1].canonicalString, { type: "typecheck", value: "any"})
            }
            return expRes
        }
        else if (expression.type == "array access") {
            const arrRes = sco(expression.children[0])
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
            if (expression.associativity == asscLeft) {
                var acc = unwrap(sco(expression.children[0]))
                for (var i = 1; i < expression.children.length; i+=2) {
                    acc = asscLeftOperate(sco, scc)(acc, expression.children[i], expression.children[i+1])
                }
                return acc
            }
            else if (expression.associativity == asscRight) {
                var acc = unwrap(sco(expression.children[expression.children.length-1]))
                for (var i = expression.children.length-3; i > -1; i-=2) {
                    acc = asscRightOperate(sco, scc)(expression.children[i], expression.children[i+1], acc)
                }
                return acc
            }
            return unwrap(sco(expression.children[0]))
        }
        else if (expression.type == "negated literal") {
            if (expression.children[0] == undefined) {
                return { type: "void" }
            }
            const expRes = sco(expression.children[0])
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
            return { type: "boolean", value: false }
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