# sci - the sic compiler/interpretrer
'sic' stands for 'sci interpreter/compiler'  
see how that kinda matches the structure of a recursive descent parser? (except that it's left recursive so it wouldn't work without conversion)
## example output for tokparse (ast constructor)
youClod(matchDefine(wrapString("str autism = 'you'"))) ->  
{ status: 'success',  
  next: [ 18, 'str autism = \'you\'' ],  
  treeNode:  
   { type: 'variable declaration',  
     data: 'str autism = \'you\'',  
     children:  
      [ { type: 'string declaration', data: 'str', children: [] },  
        { type: 'identifier', data: 'autism', children: [] },  
        { type: 'equals', data: '=', children: [] },  
        { type: 'string literal',  
          data: '\'you\'',  
          children: [ { type: 'alphanumeric literal', data: 'you', children: [] } ] } ] } }  
youClod(matchExpr(wrapString("(123\*456)+(789\*012)"))) ->  
{ status: 'success',  
  next: [ 19, '(123\*456)+(789\*012)' ],  
  treeNode:  
   { type: 'expression',  
     data: '(123\*456)+(789\*012)',  
     children:  
      [ { type: 'parenthesized expression',  
          data: '(123\*456)',  
          children:  
           [ { type: 'expression',  
               data: '123\*456',  
               children:  
                [ { type: 'integral literal', data: '123', children: [] },  
                  { type: 'operator: dm', data: '\*', children: [] },  
                  { type: 'integral literal', data: '456', children: [] } ] } ] },  
        { type: 'operator: as', data: '+', children: [] },  
        { type: 'parenthesized expression',  
          data: '(789\*012)',  
          children:  
           [ { type: 'expression',  
               data: '789\*012',  
               children:  
                [ { type: 'integral literal', data: '789', children: [] },  
                  { type: 'operator: dm', data: '\*', children: [] },  
                  { type: 'integral literal', data: '012', children: [] } ] } ] } ] } }
## refactoring considerations
tokparse.js really needs to be refactored.  
specifically, all functions should return next even on failure. this will save about 50 lines of code.