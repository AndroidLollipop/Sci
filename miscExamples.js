var a = require("./astEval.js")
var t = require("./tokParse.js")
const util = require('util')
var youClod = (x) => console.log(util.inspect(x, { showHidden: false, depth: null }))
var wrapString = (string) => {
    return [0, string]
}
// THESE SHOULD SUCCEED
youClod(t.matchEscapedLiteral(wrapString("are\\ you autistic")))
youClod(t.matchStringLiteral(wrapString("'are\\ you autistic'")))
youClod(t.matchStringLiteral(wrapString('"are\\ you autistic"')))
youClod(t.matchFloatLiteral(wrapString("123")))
youClod(t.matchFloatLiteral(wrapString("123.456")))
youClod(t.matchIdentifier(wrapString("a1")))
youClod(t.matchIf(wrapString("if asdf")))
youClod(t.matchDefine(wrapString("str autism = 'you'")))
youClod(t.matchDefine(wrapString("num star= 1")))
youClod(t.matchDefine(wrapString("num havana =1.2")))
youClod(t.matchParamd(wrapString("( asdf, abcd, efgh)")))
youClod(t.matchParamd(wrapString("( asdf, abcd, efgh,)")))
youClod(t.matchParamd(wrapString("(  asdf,    abcd  , efgh  ) ")))
youClod(t.matchParamd(wrapString("( asdf )")))
youClod(t.matchParamd(wrapString("()")))
youClod(t.matchExpr(wrapString("((((((havana))))))")))
youClod(t.matchExpr(wrapString("yellow")))
youClod(t.matchExpr(wrapString("(havana))"))) // this by itself isn't invalid, but the next call should fail immediately
youClod(t.matchExpr(wrapString("( abc * def ) + ( ghi * jkl )")))
youClod(t.matchExpr(wrapString("( 123 * 456 ) + ( 789 * 012 )")))
youClod(t.matchExpr(wrapString("(123*456)+(789*0.12)")))
youClod(t.matchDefine(wrapString("num havana = camila + young")))
// THESE SHOULD FAIL
youClod(t.matchStringLiteral(wrapString("'are\\ you autistic\"")))
youClod(t.matchFloatLiteral(wrapString("123.a")))
youClod(t.matchIdentifier(wrapString("1a")))
youClod(t.matchParamd(wrapString("(,)")))
youClod(t.matchParamd(wrapString("(1a)")))
youClod(t.matchParamd(wrapString(" (a)")))
youClod(t.matchExpr(wrapString("((havana)")))

var ex1 = t.matchDefine(wrapString("num havana = camila + young")).treeNode
var ex2 = t.matchExpr(wrapString("(123*456)+(789*0.12)")).treeNode
var se1 = (name) => name == "camila" ? { type: "number", value: 500 } : { type: "number", value: 100 }
console.log(a.evaluateExpression(a.emptyScope())(ex2))
youClod(t.matchExpr(wrapString("7+3*6*7*9")))
youClod(t.matchExpr(wrapString("7*3+6*7*9")))
youClod(t.matchExpr(wrapString("((1+2)*(3+(4*5)))+havana")))
youClod(t.matchExpr(wrapString("7+7+8*3+5")))
youClod(t.matchExpr(wrapString("7+7+8*3+5*3+3")))
youClod(t.matchFundef(wrapString("num potato(p1, p2, p3){num skye = 1;num scotland = 2; return p1+p2+p3+skye+scotland}")))
youClod(t.matchExpr(wrapString("-7*3")))
console.log(a.evaluateExpression(a.emptyScope())(t.matchFundef(wrapString("num potato(p1, p2, p3){num skye = 1;num scotland = 2; return p1+p2+p3+skye+scotland}")).treeNode))
youClod(t.matchExpr(wrapString("-7*fun(5, havana+3*0-1)")))
youClod(t.matchFunctionCall(wrapString("fun(5)")))