/** No SQL Data types */
export enum DataType {
	/** String */
	S = 'S',
	/** Number */
	N = 'N',
	/** Boolean */
	BOOL = 'BOOL',
	/** Byte */
	B = 'B',
	/** List */
	L = 'L',
	/** Map */
	M = 'M',
	/** String Set */
	SS = 'SS',
	/** Number Set */
	SN = 'SN',
	/** Byte Set */
	SB = 'SB',
	/** NULL value */
	NULL = 'NULL'
}

export enum AttribType {
	KEYS_ONLY = 'keys_only',
	ALL = 'all',
	INCLUDE = 'include'
}

export enum NoSQLReturnValue {
	OLD = 'OLD',
	NULL = 'NULL'
}

export enum NoSQLOperator {
	CONTAINS = 'contains',
	NOT_CONTAINS = 'not_contains',
	BEGINS_WITH = 'begins_with',
	ENDS_WITH = 'ends_with',
	IN = 'in',
	NOT_IN = 'not_in',
	BETWEEN = 'between',
	NOT_BETWEEN = 'not_between',
	EQUALS = 'equals',
	NOT_EQUALS = 'not_equals',
	GREATER_THAN = 'greater_than',
	LESS_THAN = 'less_than',
	GREATER_EQUAL = 'greater_equal',
	LESS_EQUAL = 'less_equal'
}

export enum NoSQLConditionGroupOperator {
	AND = 'AND',
	OR = 'OR'
}

export enum NoSQLCrudOperation {
	CREATE = 'create',
	READ = 'read',
	UPDATE = 'update',
	DELETE = 'delete'
}

export enum NoSQLUpdateOperationType {
	PUT = 'PUT',
	DELETE = 'DELETE'
}

export enum NoSQLSecondaryKeyCondition {
	BEGINS_WITH = 'begins_with',
	BETWEEN = 'between',
	EQUALS = 'equals',
	GREATER_THAN = 'greater_than',
	LESS_THAN = 'less_than',
	GREATER_EQUAL = 'greater_equal',
	LESS_EQUAL = 'less_equal'
}
