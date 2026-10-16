import type { AstNode, CompareOperator, Token } from '../types.ts'
import { FormulaError, tokenize } from './tokenizer.ts'

// Recursive descent. Each function handles one precedence level, lowest first:
//   comparison := expression (('=' | '<>' | '<' | '>' | '<=' | '>=') expression)?
//   expression := term (('+' | '-') term)*
//   term       := unary (('*' | '/') unary)*
//   unary      := ('-' | '+') unary | primary
//   primary    := number | "text" | ref (':' ref)? | NAME '(' args ')' | '(' comparison ')'
export function parseFormula(source: string): AstNode {
  const tokens = tokenize(source)
  let pos = 0

  const peek = (): Token | undefined => tokens[pos]

  const isOp = (...ops: string[]) => {
    const token = peek()
    return token?.kind === 'op' && ops.includes(token.text)
  }

  const expect = (kind: Token['kind']): Token => {
    const token = peek()
    if (!token || token.kind !== kind) throw new FormulaError('#ERR')
    pos++
    return token
  }

  function comparison(): AstNode {
    const left = expression()
    if (peek()?.kind !== 'compare') return left
    const operator = tokens[pos++].text as CompareOperator
    return { type: 'compare', operator, left, right: expression() }
  }

  function expression(): AstNode {
    let node = term()
    while (isOp('+', '-')) {
      const operator = tokens[pos++].text as '+' | '-'
      node = { type: 'binary', operator, left: node, right: term() }
    }
    return node
  }

  function term(): AstNode {
    let node = unary()
    while (isOp('*', '/')) {
      const operator = tokens[pos++].text as '*' | '/'
      node = { type: 'binary', operator, left: node, right: unary() }
    }
    return node
  }

  function unary(): AstNode {
    if (isOp('-', '+')) {
      const operator = tokens[pos++].text as '-' | '+'
      return { type: 'unary', operator, operand: unary() }
    }
    return primary()
  }

  function primary(): AstNode {
    const token = peek()
    if (!token) throw new FormulaError('#ERR')

    if (token.kind === 'number') {
      pos++
      return { type: 'number', value: Number(token.text) }
    }

    if (token.kind === 'string') {
      pos++
      return { type: 'string', value: token.text }
    }

    if (token.kind === 'ref') {
      pos++
      if (peek()?.kind === ':') {
        pos++
        return { type: 'range', from: token.text, to: expect('ref').text }
      }
      return { type: 'ref', address: token.text }
    }

    if (token.kind === 'name') {
      pos++
      expect('(')
      const args: AstNode[] = []
      if (peek()?.kind !== ')') {
        args.push(comparison())
        while (peek()?.kind === ',') {
          pos++
          args.push(comparison())
        }
      }
      expect(')')
      return { type: 'call', name: token.text, args }
    }

    if (token.kind === '(') {
      pos++
      const inner = comparison()
      expect(')')
      return inner
    }

    throw new FormulaError('#ERR')
  }

  const ast = comparison()
  if (pos < tokens.length) throw new FormulaError('#ERR')
  return ast
}
