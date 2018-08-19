var a = require("./astEval.js")
var t = require("./tokParse.js")
const util = require('util')
var youClod = (x) => console.log(util.inspect(x, { showHidden: false, depth: null }))
var wrapString = (string) => {
    return [0, string]
}
var ex1 = t.matchDefine(wrapString("num havana = camila + young")).treeNode
var se1 = (name) => name == "camila" ? { type: "number", value: 500 } : { type: "number", value: 100 }
var newGlo = a.emptyScope
console.log(a.evaluateExpression(newGlo)(t.matchExpr(wrapString("(123*456)+(789*0.12)")).treeNode))
console.log(a.evaluateExpression(newGlo)(t.matchDefine(wrapString("")).treeNode))