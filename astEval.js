// see tokparse.js for ast definition
// i haven't defined the ast properly yet so i can't write asteval yet
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
    return undefined
}
var emptyScope = () => {
    var scopeDict = {}
    return ([(name) => scopeDict[name], (name, value) => scopeDict[name] = value, (name, value) => scopeDict[name] = value])
}
var adjoinScope = ([scopeGetter, scopeSetter, scopeDefiner]) => ([newScopeGetter, newScopeSetter, newScopeDefiner]) => {
    return ((name) => {
        if (newScopeGetter[name] == undefined) {
            return scopeGetter[name]
        }
    }, (name, value) => {
        if (newScopeGetter[name] == undefined) {
            scopeSetter(name, value)
        }
        else {
            newScopeSetter(name, value)
        }
    }, newScopeDefiner)
} // i imagine this is how scope is implemented in javascript, and that explains why setting an undeclared variable makes it global
var evaluateExpression = ([scopeGetter, scopeSetter, scopeDefiner]) => (expression) => {
    if (expression.type == "variable declaration") {
        var expRes = evaluateExpression([scopeGetter, scopeSetter, scopeDefiner])(expression.children.filter((x) => x.type !== "identifier" && x.type !== "equals" && x.type !== "number declaration")[0])
        scopeDefiner(expression.children.filter((x) => x.type == "identifier")[0].canonicalString, expRes)
        return expRes
    }
    else if (expression.type == "parenthesized expression") {
        if (expression.children[0] == undefined) {
            return undefined
        }
        return evaluateExpression([scopeGetter, scopeSetter, scopeDefiner])(expression.children[0])
    }
    else if (expression.type == "expression") {
        if (expression.children[0] == undefined) {
            return undefined
        }
        var acc = evaluateExpression([scopeGetter, scopeSetter, scopeDefiner])(expression.children[0])
        for (var i = 1; i < expression.children.length; i+=2) {
            acc = operate(acc, expression.children[i], evaluateExpression([scopeGetter, scopeSetter, scopeDefiner])(expression.children[i+1]))
        }
        return acc
    }
    else if (expression.type == "float literal") {
        return { type: "number", value: parseFloat(expression.canonicalString) } // technically i'm not supposed to do this
    }
    else if (expression.type == "integral literal") {
        return { type: "number", value: parseInt(expression.canonicalString) }
    }
    else if (expression.type == "identifier") {
        return scopeGetter(expression.canonicalString)
    }
}
module.exports = {
    evaluateExpression: evaluateExpression,
    emptyScope: emptyScope,
    adjoinScope: adjoinScope
}