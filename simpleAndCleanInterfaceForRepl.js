var a = require("./astEval.js")
var t = require("./tokParse.js")
var wrapString = (string) => {
    return [0, string]
}
var getRepl = () => {
    var gloSco = a.emptyScope()
    return (string) => {
        var wrappedString = wrapString(string)
        var ret = t.matchFundef(wrappedString)
        if (ret.status !== "success") {
            ret = t.matchDefine(wrappedString)
        }
        if (ret.status !== "success") {
            ret = t.matchExpr(wrappedString)
        }
        if (ret.status !== "success") {
            return "Syntax Error!"
        }
        return a.evaluateExpression(gloSco)(ret.treeNode)
    }
}
module.exports = {
    getRepl: getRepl
}