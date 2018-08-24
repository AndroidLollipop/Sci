// why not use regex, i hear you ask
// well, we're trying to build an AST here, it's not nice to use regex to do that
var wrapString = (string) => {
    return [0, string]
}
var peek = (wrappedString) => {
    if (wrappedString[1][wrappedString[0]]) {
        return wrappedString[1][wrappedString[0]]
    }
    else if (wrappedString[0] < 0) {
        return "begin"
    }
    return "end"
}
var next = (wrappedString) => wrappedString[0] < wrappedString[1].length ? [wrappedString[0] + 1, wrappedString[1]] : wrappedString
var prev = (wrappedString) => wrappedString[0] > -1 ? [wrappedString[0] - 1, wrappedString[1]] : wrappedString
// next and prev must not mutate their parameters
var matchTerminal = (terminal) => (type) => (wrappedString) => {
    if (peek(wrappedString) == terminal) {
        return { status: "success", next: next(wrappedString), treeNode: { type: type, canonicalString: terminal, children: [] } }
    }
    else {
        return { status: "failure", next: wrappedString}
    }
}
var matchTerminals = (terminals) => (type) => (wrappedString) => {
    if (terminals.includes(peek(wrappedString))) {
        return { status: "success", next: next(wrappedString), treeNode: { type: type, canonicalString: peek(wrappedString), children: [] } }
    }
    else {
        return { status: "failure", next: wrappedString }
    }
}
var matchTerminalStrings = (terminalStrings) => (type) => (wrappedString) => {
    for (var i = 0; i < terminalStrings.length; i++) {
        if (wrappedString[1].startsWith(terminalStrings[i], wrappedString[0])) {
            return { status: "success", next: [wrappedString[0] + terminalStrings[i].length, wrappedString[1]], treeNode: { type: type, canonicalString: terminalStrings[i], children: [] } }
        }
    }
    return { status: "failure", next: wrappedString }
}
var matchTerminalsStar = (terminals) => (type) => (wrappedString) => { // to avoid having a horrifically convoluted tree structure
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
var lca = "qwertyuiopasdfghjklzxcvbnm"
var uca = "QWERTYUIOPASDFGHJKLZXCVBNM"
var num = "1234567890"
var matchWhitespace = matchTerminalsStar(" \n")
var matchOpP = matchTerminal("(")
var matchClP = matchTerminal(")")
var matchNum = matchTerminalsStar(num)
var matchLca = matchTerminalsStar(lca)
var matchUca = matchTerminalsStar(uca)
var matchAlp = matchTerminalsStar(lca + uca)
var matchAln = matchTerminalsStar(lca + uca + num)
var matchAls = matchTerminalsStar(lca + uca + num + " ")
var matchSls = matchTerminals(lca + uca + num + " ")
var matchDoC = matchTerminal('"')
var matchSiC = matchTerminal("'")
var matchEsc = matchTerminal("\\")
var matchDm = matchTerminals("/*") // ordinarily */ would be more natural, but we're following BODMAS here
var matchAs = matchTerminals("+-")
var matchOpB = matchTerminal("{")
var matchClB = matchTerminal("}")
var matchOpA = matchTerminal("[")
var matchClA = matchTerminal("]")
var matchPip = matchTerminal("|")
var matchDef = matchTerminal("=")
var matchDeq = matchTerminalStrings(["=="])
var matchLat = matchTerminal(">")
var matchSmt = matchTerminal("<")
var matchCom = matchTerminal(",")
var matchIf = matchTerminalStrings(["if"])("if")
var matchDnu = matchTerminalStrings(["num"])("number declaration")
var matchStr = matchTerminalStrings(["str"])("string declaration")
var matchSep = matchTerminal(";")
var matchCes = (wrappedString) => {
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
var matchIdentifier = (wrappedString) => {
    if (matchNum()(wrappedString).status == "success") {
        return { status: "failure", next: wrappedString } // identifiers cannot start with a numeric character
    }
    var ret = matchAln("identifier")(wrappedString)
    if (ret.status == "success") {
        return ret
    }
    return { status: "failure", next: wrappedString }
}
var matchFunctionCall = (wrappedString) => {
    var ret = matchIdentifier(wrappedString)
    if (ret.status !== "success") {
        return ret
    }
    ret.next = matchWhitespace()(ret.next).next
    var phi = matchFuncallParams(ret.next)
    if (phi.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    return { status: "success", next: phi.next, treeNode: { type: "function call", canonicalString: ret.treeNode.canonicalString + phi.treeNode.canonicalString, children: [ret.treeNode, phi.treeNode]}}
}
var matchFuncallParams = (wrappedString) => {
    var ret = matchOpP()(wrappedString)
    if (ret.status !== "success") {
        return ret
    }
    ret.next = matchWhitespace()(ret.next).next
    var rea = ""
    var reb = []
    var iet = ret
    while (true) {
        ret = matchExpr(ret.next)
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
var matchEscapedLiteral = (wrappedString) => { // only alphanumeric strings, for now... it's trivial to extend it anyway
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
var matchStringLiteral = (wrappedString) => {
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
var matchFloatLiteral = (wrappedString) => {
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
var matchNegatedLiteral = (wrappedString) => {
    var ret = matchTerminal("-")()(wrappedString)
    if (ret.status !== "success") {
        return ret
    }
    var saved = mulPrecedence
    mulPrecedence = 0
    var phi = matchBrac(ret.next)
    mulPrecedence = saved
    if (phi.status !== "success") {
        phi = matchFloatLiteral(ret.next)
    }
    if (phi.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    return { status: "success", next: phi.next, treeNode: { type: "negated literal", canonicalString: "-" + phi.treeNode.canonicalString, children: [phi.treeNode]}}
}
var composeMatch = (matchers) => (wrappedString) => { // i should have written this from the start, damn
    for (var i = 0; i < matchers.length; i++) {
        let ret = matchers[i](wrappedString)
        if (ret.status == "success") {
            return ret
        }
    }
    return { status: "failure", next: wrappedString }
}
var matchDec = composeMatch([matchDnu, matchStr])
var matchLit = composeMatch([matchNegatedLiteral, matchFloatLiteral, matchStringLiteral])
var matchDefine = (wrappedString) => {
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
    var alp = matchExpr(gam.next)
    if (alp.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    return { status: "success", next: alp.next, treeNode: { type: "variable declaration", canonicalString: ret.treeNode.canonicalString + " " + phi.treeNode.canonicalString + " " + gam.treeNode.canonicalString + " " + alp.treeNode.canonicalString, children: [ret.treeNode, phi.treeNode, gam.treeNode, alp.treeNode] } } // types must be checked at runtime since parser doesn't check them
}
var matchSetvar = (wrappedString) => {
    var phi = matchIdentifier(wrappedString)
    if (phi.status !== "success") {
        return phi
    }
    phi.next = matchWhitespace()(phi.next).next
    var gam = matchDef("equals")(phi.next)
    if (gam.status !== "success") { // yes, i am aware that maybe i should add an undefined checker to the start of every function to avoid doing this
        return { status: "failure", next: wrappedString }
    }
    gam.next = matchWhitespace()(gam.next).next
    var alp = matchExpr(gam.next)
    if (alp.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    return { status: "success", next: alp.next, treeNode: { type: "variable set", canonicalString: phi.treeNode.canonicalString + " " + gam.treeNode.canonicalString + " " + alp.treeNode.canonicalString, children: [phi.treeNode, gam.treeNode, alp.treeNode] } } // types must be checked at runtime since parser doesn't check them
}
var matchParamd = (wrappedString) => {
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
var matchFunbod = (wrappedString) => {
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
var matchFundef = (wrappedString) => {
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
var matchBrac = (wrappedString) => {
    var ret = matchOpP()(wrappedString)
    if (ret.status !== "success") {
        return ret
    }
    ret.next = matchWhitespace()(ret.next).next
    if (ret.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    var phi = matchExpr(ret.next)
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
var matchReturn = (wrappedString) => {
    var ret = matchTerminalStrings(["return"])()(wrappedString)
    if (ret.status !== "success") {
        return ret
    }
    var tem = matchWhitespace()(ret.next)
    if (tem.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    var rex = matchExpr(tem.next)
    if (rex.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    return { status: "success", next: rex.next, treeNode: { type: "return statement", canonicalString: "return " + rex.treeNode.canonicalString, children: [rex.treeNode]}}
}
var matchBrae = (wrappedString) => {
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
            tem = matchExpr(ret.next)
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
var matchOper = (wrappedString) => { // DEPRECATED, replaced with matchAper and matchMper
    var failureWrappedString = wrappedString
    wrappedString = matchWhitespace()(wrappedString).next
    var phi = matchDm("operator: dm")(wrappedString)
    var ret = matchAs("operator: as")(wrappedString)
    if (ret.status == "success") {
        phi = ret
    }
    if (phi.status !== "success") {
        return { status: "failure", next: failureWrappedString }
    }
    ret = matchExpr(phi.next)
    if (ret.status !== "success") {
        return { status: "failure", next: failureWrappedString }
    }
    if (ret.treeNode.type == "expression") {
        return { status: "success", next: ret.next, treeNode: { type: "expression", canonicalString: phi.treeNode.canonicalString + ret.treeNode.canonicalString , children: [phi.treeNode].concat(ret.treeNode.children)}}    
    }
    return { status: "success", next: ret.next, treeNode: { type: "expression", canonicalString: phi.treeNode.canonicalString + ret.treeNode.canonicalString , children: [phi.treeNode, ret.treeNode]}}
}
var matchAper = (wrappedString) => {
    var failureWrappedString = wrappedString
    wrappedString = matchWhitespace()(wrappedString).next
    var phi = matchAs("operator: as")(wrappedString)
    if (phi.status !== "success") {
        return { status: "failure", next: failureWrappedString }
    }
    ret = matchExpr(phi.next)
    if (ret.status !== "success") {
        return { status: "failure", next: failureWrappedString }
    }
    if (ret.treeNode.type == "expression") {
        return { status: "success", next: ret.next, treeNode: { type: "expression", canonicalString: phi.treeNode.canonicalString + ret.treeNode.canonicalString , children: [phi.treeNode].concat(ret.treeNode.children)}}    
    }
    return { status: "success", next: ret.next, treeNode: { type: "expression", canonicalString: phi.treeNode.canonicalString + ret.treeNode.canonicalString , children: [phi.treeNode, ret.treeNode]}}
}
var matchMper = (wrappedString) => {
    var failureWrappedString = wrappedString
    wrappedString = matchWhitespace()(wrappedString).next
    var phi = matchDm("operator: dm")(wrappedString)
    if (phi.status !== "success") {
        return { status: "failure", next: failureWrappedString }
    }
    var ret = matchExpr(phi.next)
    if (ret.status !== "success") {
        return { status: "failure", next: failureWrappedString }
    }
    if (ret.treeNode.type == "expression") {
        return { status: "success", next: ret.next, treeNode: { type: "expression", canonicalString: phi.treeNode.canonicalString + ret.treeNode.canonicalString , children: [phi.treeNode].concat(ret.treeNode.children)}}    
    }
    return { status: "success", next: ret.next, treeNode: { type: "expression", canonicalString: phi.treeNode.canonicalString + ret.treeNode.canonicalString , children: [phi.treeNode, ret.treeNode]}}
}
var mulPrecedence = 0
var matchExpr = (wrappedString) => {
    var failureWrappedString = wrappedString
    wrappedString = matchWhitespace()(wrappedString).next
    var phi = matchLit(wrappedString)
    // the canonical way is to use else ifs
    // but that's as ugly as hell and this works too so to hell with it
    var saved = mulPrecedence
    mulPrecedence = 0
    var ret = matchFunctionCall(wrappedString)
    mulPrecedence = saved
    if (ret.status == "success") {
        phi = ret
    }
    ret = matchIdentifier(wrappedString)
    if (ret.status == "success" && phi.status !== "success") {
        phi = ret
    }
    saved = mulPrecedence
    mulPrecedence = 0
    ret = matchBrac(wrappedString)
    mulPrecedence = saved
    if (ret.status == "success") {
        phi = ret
    }
    var rea = 0
    var reb
    var tem
    if (phi.status == "success") {
        saved = mulPrecedence
        mulPrecedence = 1
        tem = matchMper(phi.next)
        mulPrecedence = saved
        if (tem.status == "success") {
            if (saved == 0) {
                rea = 1 // i don't want to make this part even more heavily nested
                reb = { status: "success", next: tem.next, treeNode: {type: "parenthesized expression", canonicalString: "("+ phi.treeNode.canonicalString + tem.treeNode.canonicalString + ")" , children: [{ type: "expression", canonicalString: phi.treeNode.canonicalString + tem.treeNode.canonicalString, children: [phi.treeNode].concat(tem.treeNode.children)}]}}
            }
            else {
                return { status: "success", next: tem.next, treeNode: { type: "expression", canonicalString: phi.treeNode.canonicalString + tem.treeNode.canonicalString, children: [phi.treeNode].concat(tem.treeNode.children)}}
            }
        }
    }
    if (phi.status == "success" && mulPrecedence == 0) {
        tem = matchAper(phi.next)
        if (tem.status == "success") {
            return { status: "success", next: tem.next, treeNode: { type: "expression", canonicalString: phi.treeNode.canonicalString + tem.treeNode.canonicalString, children: [phi.treeNode].concat(tem.treeNode.children)}}
        }
    }
    if (rea == 1) {
        tem = matchAper(reb.next)
        if (tem.status == "success") {
            return { status: "success", next: tem.next, treeNode: { type: "expression", canonicalString: reb.treeNode.canonicalString + tem.treeNode.canonicalString, children: [reb.treeNode].concat(tem.treeNode.children)}}
        }
        else {
            return reb
        }
    }
    if (phi.status !== "success") {
        return { status: "failure", next: failureWrappedString }
    }
    return phi
}
var matchConditionalExpression = (wrappedString) => {
    var ret = matchOpP()(wrappedString)
    if (ret.status !== "success") {
        return ret
    }
    ret.next = matchWhitespace()(ret.next).next
    ret = matchExpr(ret.next)
    if (ret.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    ret.next = matchWhitespace()(ret.next).next
    var phi = matchDeq()(ret.next)
    if (phi.status !== "success") {
        phi = matchLat()(ret.next)
    }
    if (phi.status !== "success") {
        phi = matchSmt()(ret.next)
    }
    if (phi.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    phi.next = matchWhitespace(phi.next).next
    var rea = matchExpr(phi.next)
    if (rea.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    rea.next = matchWhitespace(rea.next).next
    var tem = matchClP()(rea.next)
    if (tem.status !== "success") {
        return { status: "failure", next: wrappedString }
    }
    return { status: "success", next: tem.next, treeNode: { type: "conditional expression", canonicalString: "(" + ret.treeNode.canonicalString + phi.treeNode.canonicalString + rea.treeNode.canonicalString + ")", children: [ret.treeNode, phi.treeNode, rea.treeNode]}}
}
var matchIfExpression = (wrappedString) => {
    var ret = matchIf(wrappedString)
    if (ret.status !== success) {
        return ret
    }
    ret.next = matchWhitespace()(ret.next).next

}
var matchProgram = (wrappedString) => {

}
//formal definition of operators
//expr -> (expr)
//expr -> identifier
//expr -> literal
//expr' -> expr op expr'
//expr' -> expr
//hmmm...................
//this is really 麻烦 to implement
module.exports = {
    matchExpr: matchExpr,
    matchStringLiteral: matchStringLiteral,
    matchEscapedLiteral: matchEscapedLiteral,
    matchFloatLiteral: matchFloatLiteral,
    matchIdentifier: matchIdentifier,
    matchIf: matchIf,
    matchParamd: matchParamd,
    matchDefine: matchDefine,
    matchFundef: matchFundef,
    matchFunbod: matchFunbod,
    matchFunctionCall: matchFunctionCall
}