export type ErrorCode = '#ERR' | '#CIRC' | '#DIV/0!' | '#REF'

export interface CellError {
  error: ErrorCode
}

// What a cell evaluates to. null means the cell is empty.
export type CellValue = number | string | CellError | null

export type TokenKind = 'number' | 'ref' | 'name' | 'op' | '(' | ')' | ',' | ':'

export interface Token {
  kind: TokenKind
  text: string
}

export type AstNode =
  | { type: 'number'; value: number }
  | { type: 'ref'; address: string }
  | { type: 'range'; from: string; to: string }
  | { type: 'unary'; operator: '-' | '+'; operand: AstNode }
  | { type: 'binary'; operator: '+' | '-' | '*' | '/'; left: AstNode; right: AstNode }
  | { type: 'call'; name: string; args: AstNode[] }

export interface EditState {
  address: string
  draft: string
  source: 'cell' | 'bar' // where the user is typing
}

export interface Toast {
  id: number
  message: string
}
