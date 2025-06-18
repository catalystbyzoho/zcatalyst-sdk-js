export interface ICatalystZiaObject {
	objects: Array<{
		co_ordinates: Array<number>;
		object_type: string;
		confidence: string;
	}>;
}

export interface ICatalystZiaOCR {
	confidence?: string;
	text: string;
}

export interface ICatalystZiaBarcode {
	content: string;
}

export interface ICatalystZiaModeration {
	probability: { [x: string]: string };
	confidence: number;
	prediction: string;
}

export interface ICatalystZiaCom {
	prediction: string;
	confidence: { [x: string]: string };
}

export interface ICatalystZiaFace {
	faces: Array<{
		confidence: number;
		id: string;
		co_ordinates: Array<number>;
		emotion: ICatalystZiaCom;
		age: ICatalystZiaCom;
		gender: ICatalystZiaCom;
		landmarks?: { [x: string]: Array<number> };
	}>;
}

export interface ICatalystZiaFaceComparison {
	confidence?: number;
	matched: boolean;
}

export interface ICatalystZiaAutoML {
	regression_result?: number;
	classification_result?: { [x: string]: number };
}

// Text analysis response
export interface ICatalystZiaSentimentAnalysisResponse {
	feature: string;
	response: {
		sentiment: string;
		sentence_analytics: Array<{
			sentence: string;
			sentiment: string;
			confidence_scores: {
				negative: number;
				neutral: number;
				positive: number;
			};
		}>;
		overall_score: number;
		keyword?: string;
	};
	status: string;
}

export interface ICatalystZiaSentimentAnalysis {
	response: Array<ICatalystZiaSentimentAnalysisResponse>;
	id: string;
	status: string;
}

export interface ICatalsytZiaKeywordExtractionResponse {
	feature: string;
	response: {
		keywords: Array<string>;
		keyphrases: Array<string>;
	};
	status: string;
}

export interface ICatalsytZiaKeywordExtraction {
	response: Array<ICatalsytZiaKeywordExtractionResponse>;
	id: string;
	status: string;
}

export interface ICatalystZiaNERPredictonResponse {
	feature: string;
	response: {
		general_entities: Array<{
			NERTag: string;
			start_index: number;
			confidence_score: number;
			end_index: number;
			Token: string;
			processed_value?: number;
		}>;
	};
	status: string;
	statusCode: number;
}

export interface ICatalystZiaNERPrediction {
	response: Array<ICatalystZiaNERPredictonResponse>;
	id: string;
	statusCode: number;
	status: string;
}

export interface ICatalystZiaTextAnalytics {
	response: Array<
		| ICatalystZiaSentimentAnalysisResponse
		| ICatalsytZiaKeywordExtractionResponse
		| ICatalystZiaNERPredictonResponse
	>;
	id: string;
	status: string;
}
