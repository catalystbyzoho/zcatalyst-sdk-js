import { ICatalystGResponse, ICatalystJSON } from '@zcatalyst/utils';

import { NoSQLByte } from './byte';
import {
	AttribType,
	DataType,
	NoSQLConditionGroupOperator,
	NoSQLCrudOperation,
	NoSQLOperator,
	NoSQLReturnValue,
	NoSQLUpdateOperationType
} from './enum';
import { NoSQLItem } from './item';
import { NoSQLByteSet, NoSQLNumberSet, NoSQLStringSet } from './set';

export interface INoSQLBase extends ICatalystGResponse {
	id: string;
	name: string;
	partition_key: INoSQLKeyColumn;
	sort_key?: INoSQLKeyColumn;
	type?: string; // find possible values for this
	status: 'CREATING' | 'ONLINE' | 'OFFLINE' | 'DELETED';
	metrics?: Record<string, unknown>;
}

export interface INoSQLKeyColumn {
	column_name: string;
	data_type: string | DataType;
}

export interface INoSQLTable extends INoSQLBase {
	ttl_enabled: boolean;
	api_access?: boolean;
	ttl_attribute?: string;
	additional_sort_keys: Array<INoSQLKeyColumn>;
	local_index?: Array<INoSQLIndex>;
	global_index: Array<INoSQLIndex>;
}

export interface INoSQLIndex extends INoSQLBase {
	id: string;
	name: string;
	projected_attributes: IProjectedAttributes;
}

export interface IProjectedAttributes {
	type: string | AttribType;
	include_columns?: Set<string>;
}

export type TNoSQLByte =
	// | ArrayBuffer
	// | Blob
	| Buffer
	// | DataView
	// | File
	| Int8Array
	| Uint8Array
	| Uint8ClampedArray
	| Int16Array
	| Uint16Array
	| Int32Array
	| Uint32Array
	| Float32Array
	| Float64Array;
// | BigInt64Array
// | BigUint64Array;

export type TNoSQLValues =
	| null
	| boolean
	| string
	| TNoSQLByte
	| number
	| bigint
	| Set<string>
	| NoSQLStringSet
	| Set<number | bigint>
	| NoSQLNumberSet
	| Set<TNoSQLByte>
	| NoSQLByteSet
	| NoSQLByte
	| Array<TNoSQLValues>
	| { [key: string]: TNoSQLValues }
	| Map<string, TNoSQLValues>;

export type TNoSQLAttribute = Partial<{
	[DataType.NULL]: boolean;
	[DataType.S]: string;
	[DataType.B]: NoSQLByte;
	[DataType.BOOL]: string;
	[DataType.N]: string;
	[DataType.SS]: NoSQLStringSet;
	[DataType.SN]: NoSQLNumberSet;
	[DataType.SB]: NoSQLByteSet;
	[DataType.L]: Array<TNoSQLAttribute>;
	[DataType.M]: TNoSQLItem;
}>;

// danger type
export type TNoSQLAttributeResponse = Partial<{
	[DataType.NULL]: boolean;
	[DataType.S]: string;
	[DataType.B]: string;
	[DataType.BOOL]: string;
	[DataType.N]: string;
	[DataType.SS]: Array<string>;
	[DataType.SN]: Array<string>;
	[DataType.SB]: Array<string>;
	[DataType.L]: Array<TNoSQLAttributeResponse>;
	[DataType.M]: Record<string, TNoSQLAttributeResponse>;
}>;

export type TNoSQLItem = Record<string, TNoSQLAttribute | TNoSQLAttributeResponse>;

export interface INoSQLConditionFunction {
	function_name: 'attribute_exists' | 'attribute_type';
	args: Array<
		| {
				attribute_path: Array<string> | string;
		  }
		| { [DataType.S]: string }
	>;
}

export interface INoSQLUpdateAttributeFunction {
	function_name: 'add' | 'append_list' | 'if_not_exists' | 'subtract';
	args: Array<
		| {
				attribute_path: Array<string>;
		  }
		| TNoSQLAttribute
	>;
}

export interface INoSQLCondition {
	function?: INoSQLConditionFunction;
	attribute?: string | Array<string>;
	operator?: NoSQLOperator;
	value?: TNoSQLAttribute;
	group_operator?: NoSQLConditionGroupOperator;
	group?: Array<INoSQLCondition>;
	negate?: boolean;
}

export interface NoSQLUpdateAttributeOperation {
	operation_type: NoSQLUpdateOperationType | string;
	attribute_path: Array<string>;
	update_value?: TNoSQLAttribute;
	update_function?: INoSQLUpdateAttributeFunction;
}

// TODO: add un-marshalling
export interface INoSQLData {
	status: string;
	old_item?: TNoSQLItem;
	item?: TNoSQLItem;
}

export interface INoSQLResponse {
	size: number;
	get: Array<INoSQLData>;
	update: Array<INoSQLData>;
	delete: Array<INoSQLData>;
	create: Array<INoSQLData>;
	start_key: TNoSQLItem;
	operation: NoSQLCrudOperation;
}

export interface INoSQLInsertItem extends ICatalystJSON {
	item: NoSQLItem | TNoSQLItem;
	return?: NoSQLReturnValue;
	condition?: INoSQLCondition;
}

export interface INoSQLUpdateItem extends ICatalystJSON {
	keys: NoSQLItem | TNoSQLItem;
	return?: 'NEW' | 'OLD' | 'NULL';
	condition?: INoSQLCondition;
	update_attributes: Array<NoSQLUpdateAttributeOperation>;
}

export interface INoSQLDeleteItem extends ICatalystJSON {
	keys: NoSQLItem | TNoSQLItem; // TODO: clarify keys and items key name is used
	return?: NoSQLReturnValue;
	condition?: INoSQLCondition;
}

export interface INoSQLFetchItem extends ICatalystJSON {
	keys: Array<NoSQLItem | TNoSQLItem> | NoSQLItem | TNoSQLItem;
	consistent_read?: boolean;
	required_attributes?: Array<Array<string>>;
}

export interface INoSQLQuery extends ICatalystJSON {
	key_condition: INoSQLCondition;
	forward_scan?: boolean;
	limit?: number;
	required_attributes?: Array<Array<string>>;
	other_condition?: INoSQLCondition;
	start_key?: NoSQLItem | TNoSQLItem;
	consistent_read?: boolean;
	additional_sort_key?: string;
}
