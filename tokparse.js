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
        return {status: "success", next: next(wrappedString), treeNode: {"type": type, "data": terminal, "children": []}}
    }
    else {
        return {status: "failure"}
    }
}
var matchTerminals = (terminals) => (type) => (wrappedString) => {
    if (terminals.includes(peek(wrappedString))) {
        return {status: "success", next: next(wrappedString), treeNode: {type: type, data: peek(wrappedString), children: []}}
    }
    else {
        return {status: "failure"}
    }
}
var matchTerminalStrings = (terminalStrings) => (type) => (wrappedString) => {
    for (var i = 0; i < terminalStrings.length; i++) {
        if (wrappedString[1].startsWith(terminalStrings[i], wrappedString[0])) {
            return {status: "success", next: [wrappedString[0] + terminalStrings[i].length, wrappedString[1]], treeNode: {type: type, data: terminalStrings[i], children: []}}
        }
    }
    return {status: "failure"}
}
var matchTerminalsStar = (terminals) => (type) => (wrappedString) => { // to avoid having a horrifically convoluted tree structure
    if (!terminals.includes(peek(wrappedString))) {
        return {status: "failure"}
    }
    var ret = peek(wrappedString)
    wrappedString = next(wrappedString)
    // pointless optimization, this is as slow as hell anyway
    while (terminals.includes(peek(wrappedString))) {
        ret += peek(wrappedString)
        wrappedString = next(wrappedString)
    }
    return {status: "success", next: wrappedString, treeNode: {type: type, data: ret, children: []}}
}
var lca = "qwertyuiopasdfghjklzxcvbnm"
var uca = "QWERTYUIOPASDFGHJKLZXCVBNM"
var num = "123456790"
var matchWhitespace = matchTerminalsStar(" \n")
var matchOpP = matchTerminal("(")
var matchClP = matchTerminal(")")
var matchNum = matchTerminalsStar(num)
var matchLca = matchTerminalsStar(lca)
var matchUca = matchTerminalsStar(uca)
var matchAlp = matchTerminalsStar(lca+uca)
var matchAln = matchTerminalsStar(lca+uca+num)
var matchAls = matchTerminalsStar(lca+uca+num+" ")
var matchSls = matchTerminals(lca+uca+num+" ")
var matchDoC = matchTerminal('"')
var matchSiC = matchTerminal("'")
var matchEsc = matchTerminal("\\")
var matchDm = matchTerminal("/*") // ordinarily */ would be more natural, but we're following BODMAS here
var matchAs = matchTerminal("+-")
var matchOpB = matchTerminal("{")
var matchClB = matchTerminal("}")
var matchOpA = matchTerminal("[")
var matchClA = matchTerminal("]")
var matchPip = matchTerminal("|")
var matchDef = matchTerminal("=")
var matchCom = matchTerminal(",")
var matchIf = matchTerminalStrings(["if"])("if")
var matchDnu = matchTerminalStrings(["num"])("number declaration")
var matchStr = matchTerminalStrings(["str"])("string declaration")
var matchCes = (wrappedString) => {
    var ret = matchEsc("escape literal")(wrappedString)
    if (ret.status == "failure") {
        return ret
    }
    ret = matchSls("escape literal")(ret.next)
    if (ret.status == "success") {
        ret.treeNode.data = "\\" + ret.treeNode.data
    }
    return ret
}
var matchIdentifier = (wrappedString) => {
    if (matchNum()(wrappedString).status == "success") {
        return {status: "failure"} // identifiers cannot start with a numeric character
    }
    var ret = matchAln("identifier")(wrappedString)
    if (ret.status == "success") {
        return ret
    }
    return {status: "failure"}
}
var matchEscapedLiteral = (wrappedString) => { // only alphanumeric strings, for now... it's trivial to extend it anyway
    var ret = matchAls("alphanumeric literal")(wrappedString)
    if (ret.status == "failure") {
        return ret
    }
    var phi = [ret.treeNode]
    var day = ret.treeNode.data
    wrappedString = ret.next
    ret = matchCes(wrappedString)
    if (ret.status == "success") {
        phi.push(ret.treeNode)
        day += ret.treeNode.data
        wrappedString = ret.next
        ret = matchEscapedLiteral(wrappedString)
        if (ret.status == "success") {
            for (var i = 0; i < ret.treeNode.children.length; i++) { // this is quite pointless, but whatever
                phi.push(ret.treeNode.children[i])
                day += ret.treeNode.children[i].data
            }
            wrappedString = ret.next
        }
    }
    return {status: "success", next: wrappedString, treeNode: {type: "escaped literal", data: day, children: phi}}
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
                phi.treeNode.data = '"' + phi.treeNode.data + '"'
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
                    phi.treeNode.data = "'" + phi.treeNode.data + "'"
                    return phi // actually i should write a combinator, that would be a better option
                }
            }
        }
    }
    return {status: "failure"}
}
var matchFloatLiteral = (wrappedString) => {
    var ret = matchNum("integral literal")(wrappedString)
    if (ret.status == "success") {
        var phi = matchTerminal(".")()(ret.next)
        if (phi.status == "success") {
            var gam = matchNum("fractional literal")(phi.next)
            if (gam.status == "success") {
                return {status: "success", next: gam.next, treeNode: {type: "float literal", data: ret.treeNode.data + phi.treeNode.data + gam.treeNode.data, children: [ret.treeNode, gam.treeNode]}}
            }
        } // yes, we intentionally fall through to fail if we get something like 123.
        else {
            return ret
        }
    }
    return {status: "failure"}
}
var composeMatch = (matchers) => (wrappedString) => { // i should have written this from the start, damn
    for (var i = 0; i < matchers.length; i++) {
        let ret = matchers[i](wrappedString)
        if (ret.status == "success") {
            return ret
        }
    }
    return {status: "failure"}
}
var matchDec = composeMatch([matchDnu, matchStr])
var matchLit = composeMatch([matchFloatLiteral, matchStringLiteral])
var matchDefine = (wrappedString) => {
    var ret = matchDec(wrappedString)
    if (ret.status == "failure") {
        return ret
    }
    var tem = matchWhitespace()(ret.next)
    if (tem.status == "failure") {
        return tem
    }
    var phi = matchIdentifier(tem.next)
    if (phi.status == "failure") {
        return ret
    }
    tem = matchWhitespace()(phi.next)
    if (tem.status == "success") {
        phi.next = tem.next
    }
    var gam = matchDef("equals")(phi.next)
    if (gam.status == "failure") { // yes, i am aware that maybe i should add an undefined checker to the start of every function to avoid doing this
        return gam
    }
    tem = matchWhitespace()(gam.next)
    if (tem.status == "success") {
        gam.next = tem.next
    }
    var alp = matchLit(gam.next)
    if (alp.status == "failure") {
        return alp
    }
    return {status: "success", next: alp.next, treeNode: {type: "variable declaration", data: ret.treeNode.data + " " + phi.treeNode.data + " " + gam.treeNode.data + " " + alp.treeNode.data, children: [ret.treeNode, phi.treeNode, gam.treeNode, alp.treeNode]}} // types must be checked at runtime since parser doesn't check them
}
var matchParamd = (wrappedString) => {
    var ret = matchOpP()(wrappedString)
    if (ret.status == "failure") {
        return ret
    }
    var tem = matchWhitespace()(ret.next)
    if (tem.status == "success") {
        ret.next = tem.next
    }
    var rea = ""
    var reb = []
    var iet = ret
    while (true) {
        ret = matchIdentifier(ret.next)
        if (ret.status !== "success") { // i know ret.status == "failure" is shorter but it risks infinite looping for invalid ret.status
            break
        }
        tem = matchWhitespace()(ret.next)
        if (tem.status == "success") {
            ret.next = tem.next
        }
        iet = ret
        rea += ret.treeNode.data
        reb.push(ret.treeNode)
        ret = matchCom()(ret.next)
        if (ret.status !== "success") {
            break
        }
        tem = matchWhitespace()(ret.next)
        if (tem.status == "success") {
            ret.next = tem.next
        }
        iet = ret
        rea += ", "
    }
    ret = matchClP()(iet.next)
    if (ret.status == "failure") {
        return ret
    }
    return {status: "success", next: ret.next, treeNode: {type: "parameter declaration", data: rea, children: reb}}
}
var matchFunbod = (wrappedString) => {

}
var matchFundef = (wrappedString) => {
    var ret = matchDec(wrappedString)
    if (ret.status == "failure") {
        return ret
    }
    var tem = matchWhitespace()(ret.next)
    if (tem.status == "failure") {
        return tem
    }
    var phi = matchIdentifier(tem.next)
    if (phi.status == "failure") {
        return ret
    }
    tem = matchWhitespace()(phi.next)
    if (tem.status == "success") {
        phi.next = tem.next
    }
    var gam = matchParamd(phi.next)
    if (gam.status == "failure") { // yes, i am aware that maybe i should add an undefined checker to the start of every function to avoid doing this
        return gam
    }
    tem = matchWhitespace()(gam.next)
    if (tem.status == "success") {
        gam.next = tem.next
    }
    var alp = matchLit(gam.next)
    if (alp.status == "failure") {
        return alp
    }
    return {status: "success", next: alp.next, treeNode: {type: "variable declaration", data: ret.treeNode.data + " " + phi.treeNode.data + " " + gam.treeNode.data + " " + alp.treeNode.data, children: [ret.treeNode, phi.treeNode, gam.treeNode, alp.treeNode]}} // types must be checked at runtime since parser doesn't check them
}
var matchExpr = (wrappedString) => {
}
var matchProgram = (wrappedString) => {
}
const util = require('util')
var youClod = (x) => console.log(util.inspect(x, {showHidden: false, depth: null}))
// THESE SHOULD SUCCEED
youClod(matchEscapedLiteral(wrapString("are\\ you autistic")))
youClod(matchStringLiteral(wrapString("'are\\ you autistic'")))
youClod(matchStringLiteral(wrapString('"are\\ you autistic"')))
youClod(matchFloatLiteral(wrapString("123")))
youClod(matchFloatLiteral(wrapString("123.456")))
youClod(matchIdentifier(wrapString("a1")))
youClod(matchIf(wrapString("if asdf")))
youClod(matchDefine(wrapString("str autism = 'you'")))
youClod(matchDefine(wrapString("num star= 1")))
youClod(matchDefine(wrapString("num havana =1.2")))
youClod(matchParamd(wrapString("( asdf, abcd, efgh)")))
youClod(matchParamd(wrapString("( asdf, abcd, efgh,)")))
youClod(matchParamd(wrapString("(asdf,abcd,efgh)")))
youClod(matchParamd(wrapString("( asdf )")))
youClod(matchParamd(wrapString("()")))
// THESE SHOULD FAIL
youClod(matchStringLiteral(wrapString("'are\\ you autistic\"")))
youClod(matchFloatLiteral(wrapString("123.a")))
youClod(matchIdentifier(wrapString("1a")))