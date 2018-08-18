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
    return {status: "success", next: next(wrappedString), treeNode: {type: type, data: ret, children: []}}
}
var matchWhitespace = matchTerminalsStar(" ")
var matchOpP = matchTerminal("(")
var matchClP = matchTerminal(")")
var matchNum = matchTerminalsStar("123456790")
var matchLca = matchTerminalsStar("qwertyuiopasdfghjklzxcvbnm")
var matchUca = matchTerminalsStar("QWERTYUIOPASDFGHJKLZXCVBNM")
var matchIdentifier = (wrappedString) => {
    var ret = []
}
var matchProgram = (wrappedString) => {
}