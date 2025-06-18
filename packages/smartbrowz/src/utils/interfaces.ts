interface ICatalystSmartbrowzOptions extends Record<string, unknown> {
	page_options?: {
		css?: { url: string } | { content: string };
		script?: { url: string } | { content: string };
		viewport?: {
			width?: number;
			height?: number;
		};
		javascript_enabled?: boolean;
		device?: string;
	};
	navigation_options?: {
		timeout?: number;
		wait_until?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
	};
}

export interface ICatalystSmartbrowzScrShot extends ICatalystSmartbrowzOptions {
	screenshot_options?: {
		type?: 'jpeg' | 'png';
		quality?: number;
		full_page?: boolean;
		omit_background?: boolean;
		capture_beyond_viewport?: boolean;
	};
}

export interface ICatalystSmartbrowzPdf extends ICatalystSmartbrowzOptions {
	pdf_options?: {
		scale?: number;
		display_header_footer?: boolean;
		header_template?: string;
		footer_template?: string;
		print_background?: boolean;
		landscape?: boolean;
		page_ranges?: string;
		format?:
			| 'A1'
			| 'A2'
			| 'A3'
			| 'A4'
			| 'A5'
			| 'A6'
			| 'Letter'
			| 'Legal'
			| 'Tabloid'
			| 'Ledger';
		width?: string;
		height?: string;
		margin?: {
			top?: string;
			bottom?: string;
			left?: string;
			right?: string;
		};
	};
}

export interface ICatalystSmartbrowzReq extends Record<string, unknown> {
	url?: string;
	html?: string;
	template_id?: string;
}

export interface ICatalystSmartbrowzTemplate {
	template_data?: Record<string, string>;
	output_options: {
		output_type: 'pdf' | 'screenshot';
	};
}

export type address = {
	city?: string;
	country?: string;
	state?: string;
	id?: string;
	street?: string;
	pincode?: string;
};
export interface IDataverseLead {
	organization_name: string;
	description: string;
	employee_count: string;
	revenue: string;
	organization_type: string;
	organization_status: string;
	email: Array<string>;
	address: Array<address>;
	contact: Array<string>;
	industries: Record<string, string>;
	social: Record<string, Array<string>>;
	founding_year: string;
	years_in_industry: string;
	territory: Array<string>;
	headquarters: Array<address>;
	ceo: string;
	logo: string;
	about_us: string;
	website: string;
	website_status: string;
	business_model: Array<string>;
	sign_in_link: string;
	sign_up_link: string;
	source_language: string;
}

export interface IDataverseTechStack {
	organization_name: string;
	website: string;
	website_status: string;
	technographic_data: Record<string, string>;
}
