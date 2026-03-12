// ─── Product types ──────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  base_product_type: string;
  internal_operations_json: string[];
  supporting_caen_codes_json: string[];
  eligible_logic: string;
  suggested_industries_json: string[];
  suitable_departments_json: string[];
  suitable_for_json: string[];
  usable_in_kits: boolean;
  active: boolean;
  notes: string;
}

export interface Operation {
  id: string;
  name: string;
  description: string;
  caen_code: string;
  active: boolean;
}

export interface Alternative {
  id: string;
  source_request_keyword: string;
  suggested_product_or_kit: string;
  explanation: string;
  relevance_tags_json: string[];
  active: boolean;
}
