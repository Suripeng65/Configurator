export enum ColumnRole {
  ATTRIBUTE = 'ATTRIBUTE',
  DIMENSION = 'DIMENSION',
  METRIC = 'METRIC',
  DROPDOWN = 'DROPDOWN',
  FOREIGN_KEY = 'FOREIGN_KEY',
  PRIMARY_KEY = 'PRIMARY_KEY',
  // new for DqlMiddleware
  STRATIFICATION = 'STRATIFICATION',
  CATEGORIZATION = 'CATEGORIZATION',
  BRACKET = 'BRACKET',
}

export enum ColumnType {
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
  ARRAY = 'ARRAY',
  OBJECT = 'OBJECT',
}

export interface Column {
  id: bigint
  columnName: string
  displayName: string
  description: string
  format: string
  type: ColumnType
  role: ColumnRole
}

export interface ColumnTemplate {
  id: bigint
  name: string
  description: string
  columns: Column[]
}
