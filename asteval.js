// see tokparse.js for ast definition
// i haven't defined the ast properly yet so i can't write asteval yet
var ex1 = 
{ type: 'variable declaration',
  canonicalString: 'num havana = camila+young',
  children:
   [ { type: 'number declaration',
       canonicalString: 'num',
       children: [] },
     { type: 'identifier', canonicalString: 'havana', children: [] },
     { type: 'equals', canonicalString: '=', children: [] },
     { type: 'expression',
       canonicalString: 'camila+young',
       children:
        [ { type: 'identifier', canonicalString: 'camila', children: [] },
          { type: 'operator: as', canonicalString: '+', children: [] },
          { type: 'identifier', canonicalString: 'young', children: [] } ] } ] }
var se1 = (name) => name == "camila" ? { type: "number", value: 500 } : { type: "number", value: 100 }
var ex2 =
{ type: 'expression',
  canonicalString: '(123*456)+(789*0.12)',
  children:
   [ { type: 'parenthesized expression',
       canonicalString: '(123*456)',
       children:
        [ { type: 'expression',
            canonicalString: '123*456',
            children:
             [ { type: 'integral literal',
                 canonicalString: '123',
                 children: [] },
               { type: 'operator: dm', canonicalString: '*', children: [] },
               { type: 'integral literal',
                 canonicalString: '456',
                 children: [] } ] } ] },
     { type: 'operator: as', canonicalString: '+', children: [] },
     { type: 'parenthesized expression',
       canonicalString: '(789*0.12)',
       children:
        [ { type: 'expression',
            canonicalString: '789*0.12',
            children:
             [ { type: 'integral literal',
                 canonicalString: '789',
                 children: [] },
               { type: 'operator: dm', canonicalString: '*', children: [] },
               { type: 'float literal',
                 canonicalString: '0.12',
                 children:
                  [ { type: 'integral literal', canonicalString: '0', children: [] },
                    { type: 'fractional literal',
                      canonicalString: '12',
                      children: [] } ] } ] } ] } ] }
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
var evaluateExpression = (scoper) => (expression) => {
    if (expression.type == "parenthesized expression") {
        if (expression.children[0] == undefined) {
            return undefined
        }
        return evaluateExpression(scoper)(expression.children[0])
    }
    else if (expression.type == "expression") {
        if (expression.children[0] == undefined) {
            return undefined
        }
        var acc = evaluateExpression(scoper)(expression.children[0])
        for (var i = 1; i < expression.children.length; i+=2) {
            console.log(acc, expression.children[i], evaluateExpression(scoper)(expression.children[i+1]))
            acc = operate(acc, expression.children[i], evaluateExpression(scoper)(expression.children[i+1]))
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
        return scoper(expression.canonicalString)
    }
}
console.log(evaluateExpression(() => {})(ex2))