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
//next and prev must not mutate their parameters
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
var matchTerminalsStar = (terminals) => (type) => (wrappedString) => {
    if (!terminals.includes(peek(wrappedString))) {
        return {status: "failure"}
    }
    var ret = peek(wrappedString)
    wrappedString = next(wrappedString)
    //pointless optimization, this is as slow as hell anyway
    while (terminals.includes(peek(wrappedString))) {
        ret += peek(wrappedString)
        wrappedString = next(wrappedString)
    }
    return {status: "success", next: wrappedString, treeNode: {type: type, data: ret, children: []}}
}
var lca = "qwertyuiopasdfghjklzxcvbnm"
var uca = "QWERTYUIOPASDFGHJKLZXCVBNM"
var num = "123456790"
var dm = "*/"
var as = "+-"
var matchWhitespace = matchTerminalsStar(" ")
var matchOpP = matchTerminal("(")
var matchClP = matchTerminal(")")
var matchNum = matchTerminalsStar(num)
var matchLca = matchTerminalsStar(lca)
var matchUca = matchTerminalsStar(uca)
var matchAlp = matchTerminalsStar(lca+uca)
var matchAln = matchTerminalsStar(lca+uca+num)
var matchDoC = matchTerminal('"')
var matchSiC = matchTerminal("'")
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
var matchExpr = (wrappedString) => {
    if (matchExpr(wrappedString)){
        
    }
}
var matchProgram = (wrappedString) => {
}