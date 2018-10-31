// why not use regex, i hear you ask
// well, we're trying to build an AST here, it's not nice to use regex to do that
const wrapString = (string) => {
    return [0, string]
}
const peek = (wrappedString) => {
    if (wrappedString[1][wrappedString[0]]) {
        return wrappedString[1][wrappedString[0]]
    }
    else if (wrappedString[0] < 0) {
        return "begin"
    }
    return "end"
}
const next = (wrappedString) => wrappedString[0] < wrappedString[1].length ? [wrappedString[0] + 1, wrappedString[1]] : wrappedString
const prev = (wrappedString) => wrappedString[0] > -1 ? [wrappedString[0] - 1, wrappedString[1]] : wrappedString
// next and prev must not mutate their parameters
const matchTerminal = (terminal) => (type) => (wrappedString) => {
    if (peek(wrappedString) == terminal) {
        return { status: "success", next: next(wrappedString), treeNode: { type: type, canonicalString: terminal, children: [] } }
    }
    else {
        return { status: "failure", next: wrappedString}
    }
}
const matchTerminals = (terminals) => (type) => (wrappedString) => {
    if (terminals.includes(peek(wrappedString))) {
        return { status: "success", next: next(wrappedString), treeNode: { type: type, canonicalString: peek(wrappedString), children: [] } }
    }
    else {
        return { status: "failure", next: wrappedString }
    }
}
const matchTerminalStrings = (terminalStrings) => (type) => (wrappedString) => {
    for (var i = 0; i < terminalStrings.length; i++) {
        if (wrappedString[1].startsWith(terminalStrings[i], wrappedString[0])) {
            return { status: "success", next: [wrappedString[0] + terminalStrings[i].length, wrappedString[1]], treeNode: { type: type, canonicalString: terminalStrings[i], children: [] } }
        }
    }
    return { status: "failure", next: wrappedString }
}
const matchTerminalsStar = (terminals) => (type) => (wrappedString) => { // to avoid having a horrifically convoluted tree structure
    if (!terminals.includes(peek(wrappedString))) {
        return { status: "failure", next: wrappedString }
    }
    var ret = peek(wrappedString)
    wrappedString = next(wrappedString)
    // pointless optimization, this is as slow as hell anyway
    while (terminals.includes(peek(wrappedString))) {
        ret += peek(wrappedString)
        wrappedString = next(wrappedString)
    }
    return { status: "success", next: wrappedString, treeNode: { type: type, canonicalString: ret, children: [] } }
}
const lca = "qwertyuiopasdfghjklzxcvbnm"
const uca = "QWERTYUIOPASDFGHJKLZXCVBNM"
const num = "1234567890"
const matchWhitespace = matchTerminalsStar(" \n")
const matchOpP = matchTerminal("(")
const matchClP = matchTerminal(")")
const matchNum = matchTerminalsStar(num)
const matchLca = matchTerminalsStar(lca)
const matchUca = matchTerminalsStar(uca)
const matchAlp = matchTerminalsStar(lca + uca)
const matchAln = matchTerminalsStar(lca + uca + num)
const matchAls = matchTerminalsStar(lca + uca + num + " ,./;[]<>?:{}|!@#$%^&*()_+-=")
const matchSls = matchTerminals(lca + uca + num + " ")
const matchDoC = matchTerminal('"')
const matchSiC = matchTerminal("'")
const matchEsc = matchTerminal("\\")
const matchDm = matchTerminals("/*") // ordinarily */ would be more natural, but we're following BODMAS here
const matchAs = matchTerminals("+-")
const matchAo = matchTerminalStrings(["&&", "||"])
const matchEn = matchTerminalStrings(["==", "!="])
const matchGs = matchTerminalStrings([">", "<", ">=", "<="])
const matchOpB = matchTerminal("{")
const matchClB = matchTerminal("}")
const matchOpA = matchTerminal("[")
const matchClA = matchTerminal("]")
const matchPip = matchTerminal("|")
const matchDef = matchTerminal("=")
const matchEls = matchTerminalStrings(["else"])
const matchCom = matchTerminal(",")
const matchIf = matchTerminalStrings(["if"])("if")
const matchWhile = matchTerminalStrings(["while"])("while")
const matchDnu = matchTerminalStrings(["num"])("typed declaration")
const matchDbo = matchTerminalStrings(["bool"])("typed declaration")
const matchStr = matchTerminalStrings(["str"])("typed declaration")
const matchVar = matchTerminalStrings(["var"])("untyped declaration")
const matchSep = matchTerminal(";")
const matchCes = (wrappedString) => {
    var ret = matchEsc("escape literal")(wrappedString)
    if (ret.status !== "success") {
        return ret
    }
    ret = matchSls("escape literal")(ret.next)
    if (ret.status == "success") {
        ret.treeNode.canonicalString = "\\" + ret.treeNode.canonicalString
    }
    else {
        return { status: "failure", next: wrappedString }
    }
    return ret
}
const matchIdentifier = (wrappedString) => {
    if (matchNum()(wrappedString).status == "success") {
        return { status: "failure", next: wrappedString } // identifiers cannot start with a numeric character
    }
    var ret = matchAln("identifier")(wrappedString)
    if (ret.status == "success") {
        return ret
    }
    return { status: "failure", next: wrappedString }
}
const matchFuncallParams = (wrappedString) => {
    var ret = matchOpP()(wrappedString)
    if (ret.status !== "success") {
        return ret
    }
    ret.next = matchWhitespace()(ret.next).next
    var rea = ""
    var reb = []
    var iet = ret
    while (true) {
        ret = matchExpr(MPR)(ret.next)
        if (ret.status !== "success") {
            break
        }
        ret.next = matchWhitespace()(ret.next).next
        iet = ret
        rea += ret.treeNode.canonicalString
        reb.push(ret.treeNode)
        ret = matchCom()(ret.next)
        if (ret.status !== "success") {
            break
        }
        ret.next = matchWhitespace()(ret.next).next
        iet = ret
        rea += ", "
    }
    ret = matchClP()(iet.next)
    if (ret.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    return { status: "success", next: ret.next, treeNode: { type: "function call bindings", canonicalString: "(" + rea + ")", children: reb}}
}
const matchArrayIndex = (wrappedString) => {
    var ret = matchOpA()(wrappedString)
    if (ret.status !== "success") {
        return ret
    }
    ret.next = matchWhitespace()(ret.next).next
    ret = matchExpr(MPR)(ret.next)
    if (ret.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    ret.next = matchWhitespace()(ret.next).next
    var tem = matchClA()(ret.next)
    if (tem.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    return { status: "success", next: tem.next, treeNode: { type: "array index", canonicalString: "[" + ret.treeNode.canonicalString + "]", children: [ret.treeNode]}}
}
const matchEscapedLiteral = (wrappedString) => { // only alphanumeric strings, for now... it's trivial to extend it anyway
    var ret = matchAls("alphanumeric literal")(wrappedString)
    if (ret.status !== "success") {
        return ret
    }
    var phi = [ret.treeNode]
    var day = ret.treeNode.canonicalString
    wrappedString = ret.next
    ret = matchCes(wrappedString)
    if (ret.status == "success") {
        phi.push(ret.treeNode)
        day += ret.treeNode.canonicalString
        wrappedString = ret.next
        ret = matchEscapedLiteral(wrappedString)
        if (ret.status == "success") {
            for (var i = 0; i < ret.treeNode.children.length; i++) { // this is quite pointless, but whatever
                phi.push(ret.treeNode.children[i])
                day += ret.treeNode.children[i].canonicalString
            }
            wrappedString = ret.next
        }
    }
    return { status: "success", next: wrappedString, treeNode: { type: "escaped literal", canonicalString: day, children: phi } }
}
const matchStringLiteral = (wrappedString) => {
    var phi
    var ret = matchDoC()(wrappedString)
    if (ret.status == "success") {
        ret = matchEscapedLiteral(ret.next)
        if (ret.status == "success") {
            phi = ret
            ret = matchDoC()(ret.next)
            if (ret.status == "success") {
                phi.next = ret.next
                phi.treeNode.type = "string literal"
                phi.treeNode.canonicalString = '"' + phi.treeNode.canonicalString + '"'
                return phi
            }
        }
    }
    else {
        ret = matchSiC()(wrappedString)
        if (ret.status == "success") {
            ret = matchEscapedLiteral(ret.next)
            if (ret.status == "success") {
                phi = ret
                ret = matchSiC()(ret.next)
                if (ret.status == "success") {
                    phi.next = ret.next
                    phi.treeNode.type = "string literal"
                    phi.treeNode.canonicalString = "'" + phi.treeNode.canonicalString + "'"
                    return phi // actually i should write a combinator, that would be a better option
                }
            }
        }
    }
    return { status: "failure", next: wrappedString }
}
const matchArrayLiteral = (wrappedString) => {
    var ret = matchOpA()(wrappedString)
    if (ret.status !== "success") {
        return ret
    }
    ret.next = matchWhitespace()(ret.next).next
    var rea = ""
    var reb = []
    var iet = ret
    while (true) {
        ret = matchExpr(MPR)(ret.next)
        if (ret.status !== "success") {
            break
        }
        ret.next = matchWhitespace()(ret.next).next
        iet = ret
        rea += ret.treeNode.canonicalString
        reb.push(ret.treeNode)
        ret = matchCom()(ret.next)
        if (ret.status !== "success") {
            break
        }
        ret.next = matchWhitespace()(ret.next).next
        iet = ret
        rea += ", "
    }
    ret = matchClA()(iet.next)
    if (ret.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    return { status: "success", next: ret.next, treeNode: { type: "array literal", canonicalString: "[" + rea + "]", children: reb}}
}
const matchFloatLiteral = (wrappedString) => {
    var ret = matchNum("integral literal")(wrappedString)
    if (ret.status == "success") {
        var phi = matchTerminal(".")()(ret.next)
        if (phi.status == "success") {
            var gam = matchNum("fractional literal")(phi.next)
            if (gam.status == "success") {
                return { status: "success", next: gam.next, treeNode: { type: "float literal", canonicalString: ret.treeNode.canonicalString + phi.treeNode.canonicalString + gam.treeNode.canonicalString, children: [ret.treeNode, gam.treeNode] } }
            }
        } // yes, we intentionally fall through to fail if we get something like 123.
        else if (ret.status == "success") {
            return ret
        }
    }
    return { status: "failure", wrappedString }
}
const matchNegatedLiteral = (wrappedString) => {
    var ret = matchTerminal("-")()(wrappedString)
    if (ret.status !== "success") {
        return ret
    }
    var phi = matchBrac(ret.next)
    if (phi.status !== "success") {
        phi = matchFloatLiteral(ret.next)
    }
    if (phi.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    return { status: "success", next: phi.next, treeNode: { type: "negated literal", canonicalString: "-" + phi.treeNode.canonicalString, children: [phi.treeNode]}}
}
const matchBooleanLiteral = matchTerminalStrings(["true", "false"])("boolean literal")
const composeMatch = (matchers) => (wrappedString) => { // i should have written this from the start, damn
    for (var i = 0; i < matchers.length; i++) {
        let ret = matchers[i](wrappedString)
        if (ret.status == "success") {
            return ret
        }
    }
    return { status: "failure", next: wrappedString }
}
const matchDec = composeMatch([matchDnu, matchStr, matchVar, matchDbo])
const matchLit = composeMatch([matchNegatedLiteral, matchFloatLiteral, matchStringLiteral, matchArrayLiteral, matchBooleanLiteral])
const matchDefine = (wrappedString) => {
    var ret = matchDec(wrappedString)
    if (ret.status !== "success") {
        return ret
    }
    var tem = matchWhitespace()(ret.next)
    if (tem.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    var phi = matchIdentifier(tem.next)
    if (phi.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    phi.next = matchWhitespace()(phi.next).next
    var gam = matchDef("equals")(phi.next)
    if (gam.status !== "success") { // yes, i am aware that maybe i should add an undefined checker to the start of every function to avoid doing this
        return { status: "failure", next: wrappedString }
    }
    gam.next = matchWhitespace()(gam.next).next
    var alp = matchExpr(MPR)(gam.next)
    if (alp.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    return { status: "success", next: alp.next, treeNode: { type: "variable declaration", canonicalString: ret.treeNode.canonicalString + " " + phi.treeNode.canonicalString + " " + gam.treeNode.canonicalString + " " + alp.treeNode.canonicalString, children: [ret.treeNode, phi.treeNode, gam.treeNode, alp.treeNode] } } // types must be checked at runtime since parser doesn't check them
}
const matchSetvar = (wrappedString) => {
    var phi = matchExpr(MPR)(wrappedString)
    if (phi.status !== "success") {
        return phi
    }
    phi.next = matchWhitespace()(phi.next).next
    var gam = matchDef("equals")(phi.next)
    if (gam.status !== "success") { // yes, i am aware that maybe i should add an undefined checker to the start of every function to avoid doing this
        return { status: "failure", next: wrappedString }
    }
    gam.next = matchWhitespace()(gam.next).next
    var alp = matchExpr(MPR)(gam.next)
    if (alp.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    return { status: "success", next: alp.next, treeNode: { type: "variable set", canonicalString: phi.treeNode.canonicalString + " " + gam.treeNode.canonicalString + " " + alp.treeNode.canonicalString, children: [phi.treeNode, gam.treeNode, alp.treeNode] } } // types must be checked at runtime since parser doesn't check them
}
const matchParamd = (wrappedString) => {
    var ret = matchOpP()(wrappedString)
    if (ret.status !== "success") {
        return ret
    }
    ret.next = matchWhitespace()(ret.next).next
    var rea = ""
    var reb = []
    var iet = ret
    while (true) {
        ret = matchIdentifier(ret.next)
        if (ret.status !== "success") { // i know ret.status == "failure" is shorter but it risks infinite looping for invalid ret.status
            break
        }
        ret.next = matchWhitespace()(ret.next).next
        iet = ret
        rea += ret.treeNode.canonicalString
        reb.push(ret.treeNode)
        ret = matchCom()(ret.next)
        if (ret.status !== "success") {
            break
        }
        ret.next = matchWhitespace()(ret.next).next
        iet = ret
        rea += ", "
    }
    ret = matchClP()(iet.next)
    if (ret.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    return { status: "success", next: ret.next, treeNode: { type: "parameter declaration", canonicalString: "(" + rea + ")", children: reb } }
}
const matchFunbod = (wrappedString) => {
    var ret = matchOpB()(wrappedString)
    if (ret.status !== "success") {
        return ret
    }
    ret.next = matchWhitespace()(ret.next).next
    ret = matchBrae(ret.next)
    if (ret.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    var phi = matchClB()(ret.next)
    if (phi.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    return { status: "success", next: phi.next, treeNode: {type: "function body", canonicalString: "{" + ret.treeNode.canonicalString + "}", children: ret.treeNode.children}}
}
const matchFundef = (wrappedString) => {
    var ret = matchDec(wrappedString)
    if (ret.status !== "success") {
        return ret
    }
    var tem = matchWhitespace()(ret.next)
    if (tem.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    var phi = matchIdentifier(tem.next)
    if (phi.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    phi.next = matchWhitespace()(phi.next).next
    var gam = matchParamd(phi.next)
    if (gam.status !== "success") { // yes, i am aware that maybe i should add an undefined checker to the start of every function to avoid doing this
        return { status: "failure", next: wrappedString }
    }
    gam.next = matchWhitespace()(gam.next).next
    var alp = matchFunbod(gam.next)
    if (alp.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    return { status: "success", next: alp.next, treeNode: { type: "function declaration", canonicalString: ret.treeNode.canonicalString + " " + phi.treeNode.canonicalString + " " + gam.treeNode.canonicalString + " " + alp.treeNode.canonicalString, children: [ret.treeNode, phi.treeNode, gam.treeNode, alp.treeNode] } } // types must be checked at runtime since parser doesn't check them
}
const matchBrac = (wrappedString) => {
    var ret = matchOpP()(wrappedString)
    if (ret.status !== "success") {
        return ret
    }
    ret.next = matchWhitespace()(ret.next).next
    if (ret.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    var phi = matchExpr(MPR)(ret.next)
    if (phi.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    phi.next = matchWhitespace()(phi.next).next
    var alp = matchClP()(phi.next)
    if (alp.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    return { status: "success", next: alp.next, treeNode: { type: "parenthesized expression", canonicalString: "(" + phi.treeNode.canonicalString + ")", children: [phi.treeNode] } }
}
const matchReturn = (wrappedString) => {
    var ret = matchTerminalStrings(["return"])()(wrappedString)
    if (ret.status !== "success") {
        return ret
    }
    var tem = matchWhitespace()(ret.next)
    if (tem.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    var rex = matchExpr(MPR)(tem.next)
    if (rex.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    return { status: "success", next: rex.next, treeNode: { type: "return statement", canonicalString: "return " + rex.treeNode.canonicalString, children: [rex.treeNode]}}
}
const matchBrae = (wrappedString) => {
    var phi = []
    var ret = { next: wrappedString }
    var tem
    var rst = ""
    while (true) {
        ret.next = matchWhitespace()(ret.next).next
        tem = matchReturn(ret.next)
        if (tem.status !== "success") {
            tem = matchFundef(ret.next)
        }
        if (tem.status !== "success") {
            tem = matchDefine(ret.next)
        }
        if (tem.status !== "success") {
            tem = matchSetvar(ret.next)
        }
        if (tem.status !== "success") {
            tem = matchExpr(MPR)(ret.next)
        }
        if (tem.status !== "success") {
            break
        }
        ret = tem
        phi.push(tem.treeNode)
        rst += tem.treeNode.canonicalString + ";"
        ret.next = matchWhitespace()(ret.next).next
        tem = matchSep()(ret.next)
        if (tem.status == "success") {
            ret.next = tem.next
        } // we don't need to handle fail, since this will fail the next iteration anyway (which also removes any trailing whitespace)
    }
    return { status: "success", next: ret.next, treeNode: { type: "braced expressions", canonicalString: rst, children: phi}}
}
const matchOperClass = (operatorClassMatcher) => (operatorClassName) => (precedenceLevel) => (wrappedString) => {
    var failureWrappedString = wrappedString
    wrappedString = matchWhitespace()(wrappedString).next
    var phi = operatorClassMatcher(operatorClassName)(wrappedString)
    if (phi.status !== "success") {
        return { status: "failure", next: failureWrappedString }
    }
    var ret = matchExpr(precedenceLevel)(phi.next)
    if (ret.status !== "success") {
        return { status: "failure", next: failureWrappedString }
    }
    if (ret.treeNode.type == "expression") {
        return { status: "success", next: ret.next, treeNode: { type: "expression", canonicalString: phi.treeNode.canonicalString + ret.treeNode.canonicalString , children: [phi.treeNode].concat(ret.treeNode.children)}}    
    }
    return { status: "success", next: ret.next, treeNode: { type: "expression", canonicalString: phi.treeNode.canonicalString + ret.treeNode.canonicalString , children: [phi.treeNode, ret.treeNode]}}
}
const MPR = 0
const mperPre = 4
const aperPre = 3
const gsthPre = 2
const eneqPre = 1
const anorPre = 0
// for optimization purposes we want our precedence levels to be nonnegative integers
const matchMper = matchOperClass(matchDm)("operator: dm")(mperPre)
const matchAper = matchOperClass(matchAs)("operator: as")(aperPre)
const matchGsth = matchOperClass(matchGs)("operator: gs")(gsthPre)
const matchEneq = matchOperClass(matchEn)("operator: en")(eneqPre)
const matchAnor = matchOperClass(matchAo)("operator: ao")(anorPre)
const operatorMatchers = [
    { matcher: matchMper, precedenceLevel: mperPre },
    { matcher: matchAper, precedenceLevel: aperPre },
    { matcher: matchGsth, precedenceLevel: gsthPre },
    { matcher: matchEneq, precedenceLevel: eneqPre },
    { matcher: matchAnor, precedenceLevel: anorPre }
]
const matchExpr = (minPrecedenceLevel) => (wrappedString) => {
    const failureWrappedString = wrappedString
    wrappedString = matchWhitespace()(wrappedString).next
    var phi = matchLit(wrappedString)
    // the canonical way is to use else ifs
    // but that's as ugly as hell and this works too so to hell with it
    var ret = matchIfExpression(wrappedString)
    if (ret.status == "success") {
        phi = ret
    }
    ret = matchWhileExpression(wrappedString)
    if (ret.status == "success") {
        phi = ret
    }
    ret = matchIdentifier(wrappedString)
    if (ret.status == "success" && phi.status !== "success") {
        phi = ret
    }
    ret = matchBrac(wrappedString)
    if (ret.status == "success") {
        phi = ret
    }
    var tem
    if (phi.status == "success") {
        while (true) {
            tem = matchWhitespace()(phi.next)
            ret = matchFuncallParams(tem.next)
            if (ret.status == "success") {
                phi = { status: "success", next: ret.next, treeNode: { type: "function call", canonicalString: phi.treeNode.canonicalString + ret.treeNode.canonicalString, children: [phi.treeNode, ret.treeNode]}}
            }
            else {
                ret = matchArrayIndex(tem.next)
                if (ret.status == "success") {
                    phi = { status: "success", next: ret.next, treeNode: { type: "array access", canonicalString: phi.treeNode.canonicalString + ret.treeNode.canonicalString, children: [phi.treeNode, ret.treeNode]}}
                }
                else {
                    break
                }
            }
        }
    }
    for (var i = 0; i < operatorMatchers.length; i++) { // improvement: just use array index as precedence level. i'll implement this tomorrow cos it's 3:43 am now.
        if (phi.status == "success" && minPrecedenceLevel <= operatorMatchers[i].precedenceLevel) {
            tem = operatorMatchers[i].matcher(phi.next)
            if (tem.status == "success") {
                if (minPrecedenceLevel == operatorMatchers[i].precedenceLevel) {
                    return { status: "success", next: tem.next, treeNode: { type: "expression", canonicalString: phi.treeNode.canonicalString + tem.treeNode.canonicalString, children: [phi.treeNode].concat(tem.treeNode.children)}}
                }
                else {
                    phi = { status: "success", next: tem.next, treeNode: { type: "expression", canonicalString: phi.treeNode.canonicalString + tem.treeNode.canonicalString, children: [{ type: "expression", canonicalString: phi.treeNode.canonicalString + tem.treeNode.canonicalString, children: [phi.treeNode].concat(tem.treeNode.children)}]}}
                }
            }
        }
    }
    if (phi.status !== "success") {
        return { status: "failure", next: failureWrappedString }
    }
    return phi
}
const matchConditionalExpression = (wrappedString) => {
    var ret = matchOpP()(wrappedString)
    if (ret.status !== "success") {
        return ret
    }
    ret.next = matchWhitespace()(ret.next).next
    ret = matchExpr(MPR)(ret.next)
    if (ret.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    ret.next = matchWhitespace()(ret.next).next
    var tem = matchClP()(ret.next)
    if (tem.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    return { status: "success", next: tem.next, treeNode: { type: "expression", canonicalString: "(" + ret.treeNode.canonicalString + ")", children: ret.treeNode.children}}
}
const matchIfExpression = (wrappedString) => {
    var ret = matchIf(wrappedString)
    if (ret.status !== "success") {
        return ret
    }
    ret.next = matchWhitespace()(ret.next).next
    ret = matchConditionalExpression(ret.next)
    if (ret.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    ret.next = matchWhitespace()(ret.next).next
    var phi = matchFunbod(ret.next)
    if (phi.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    phi.treeNode.type = "block body"
    phi.next = matchWhitespace()(phi.next).next
    var rea = matchEls()(phi.next)
    if (rea.status !== "success") {
        return { status: "success", next: phi.next, treeNode: { type: "if expression", canonicalString: "if " + ret.treeNode.canonicalString + phi.treeNode.canonicalString, children: [ret.treeNode, phi.treeNode]}}
    }
    rea.next = matchWhitespace()(rea.next).next
    rea = matchFunbod(rea.next)
    if (rea.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    return { status: "success", next: rea.next, treeNode: { type: "if else expression", canonicalString: "if " + ret.treeNode.canonicalString + phi.treeNode.canonicalString + " else " + rea.treeNode.canonicalString, children: [ret.treeNode, phi.treeNode, rea.treeNode]}}
}
const matchWhileExpression = (wrappedString) => {
    var ret = matchWhile(wrappedString)
    if (ret.status !== "success") {
        return ret
    }
    ret.next = matchWhitespace()(ret.next).next
    ret = matchConditionalExpression(ret.next)
    if (ret.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    ret.next = matchWhitespace()(ret.next).next
    var phi = matchFunbod(ret.next)
    if (phi.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    phi.treeNode.type = "block body"
    phi.next = matchWhitespace()(phi.next).next
    return { status: "success", next: phi.next, treeNode: { type: "while expression", canonicalString: "while " + ret.treeNode.canonicalString + phi.treeNode.canonicalString, children: [ret.treeNode, phi.treeNode]}}
}
const matchProgram = (wrappedString) => {
    var ret = matchBrae(wrappedString)
    if (ret.status !== "success") {
        return ret
    }
    ret.treeNode.type = "function body"
    return { status: "success", next: ret.next, treeNode: { type: "parenthesized expression", canonicalString: ret.canonicalString, children: [ret.treeNode]}}
}
//formal definition of operators
//expr -> (expr)
//expr -> identifier
//expr -> literal
//expr' -> expr op expr'
//expr' -> expr
//hmmm...................
//this is really 麻烦 to implement
//plan for implementing arrays:
//should be even easier than implementing functions.
//repurpose function parser with square brackets
//add runtime positive integer coercion for floats
//array length is largest index + 1
module.exports = {
    wrapString: wrapString,
    matchExpr: matchExpr,
    matchExprExtern: matchExpr(MPR),
    matchStringLiteral: matchStringLiteral,
    matchEscapedLiteral: matchEscapedLiteral,
    matchFloatLiteral: matchFloatLiteral,
    matchIdentifier: matchIdentifier,
    matchIf: matchIf,
    matchParamd: matchParamd,
    matchDefine: matchDefine,
    matchFundef: matchFundef,
    matchFunbod: matchFunbod,
    matchIfExpression: matchIfExpression,
    matchProgram: matchProgram
}