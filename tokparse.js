// why not use regex, i hear you ask
// well, we're trying to build an AST tree here, it's not nice to use regex to do that
var wrapString = (string) => {
    return [0, string]
}
var peek = (wrappedString) => {
    if (wrappedString[1][wrappedString[0]]){
        return wrappedString[1][wrappedString[0]]
    }
    else if (wrappedString[1].length < 0){
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
var matchWhitespace = matchTerminalsStar(" ")
var matchOpP = matchTerminal("(")
var matchClP = matchTerminal(")")
var matchNum = matchTerminalsStar(num)
var matchLca = matchTerminalsStar(lca)
var matchUca = matchTerminalsStar(uca)
var matchAlp = matchTerminalsStar(lca+uca)
var matchAln = matchTerminalsStar(lca+uca+num)
var matchAls = matchTerminalsStar(lca+uca+num+" ")
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
        return {status: "failure"}
    }
    var phi = [ret.treeNode]
    var day = ret.treeNode.data
    wrappedString = ret.next
    ret = matchEsc("escape literal")(wrappedString)
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
var matchExpr = (wrappedString) => {
}
var matchProgram = (wrappedString) => {
}
const util = require('util')
var youClod = (x) => console.log(util.inspect(x, {showHidden: false, depth: null}))
//THESE SHOULD SUCCEED
youClod(matchEscapedLiteral(wrapString("are\\ you autistic")))
youClod(matchStringLiteral(wrapString("'are\\ you autistic'")))
youClod(matchStringLiteral(wrapString('"are\\ you autistic"')))
youClod(matchFloatLiteral(wrapString("123")))
youClod(matchFloatLiteral(wrapString("123.456")))
youClod(matchIdentifier(wrapString("a1")))
//THESE SHOULD FAIL
youClod(matchStringLiteral(wrapString("'are\\ you autistic\"")))
youClod(matchFloatLiteral(wrapString("123.a")))
youClod(matchIdentifier(wrapString("1a")))