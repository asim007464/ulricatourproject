export type ProductLocation = {
  name: string;
  base_price: number;
  extra_fee: number;
};

export type DbProduct = {
  id: string;
  slug: string;
  wordpress_id: string | null;
  title: string;
  category: "tour" | "taxi";
  base_price: number;
  base_pax_limit: number;
  extra_surcharge: number;
  max_seats: number;
  min_pax: number;
  duration_days: number;
  rental_type: string;
  description: string | null;
  body_html: string | null;
  image_url: string | null;
  detail_image_url: string | null;
  locations: ProductLocation[];
  blocked_dates: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type DbOrder = {
  id: string;
  product_slug: string;
  product_title: string;
  order_type: "paid" | "request" | "pending";
  status: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  customer_message: string | null;
  pickup_date: string;
  dropoff_date: string;
  guests: number;
  departure_location: string | null;
  amount: number | null;
  currency: string;
  paypal_order_id: string | null;
  created_at: string;
};

export type OrderInsert = Omit<DbOrder, "id" | "created_at">;

export type DbSitePage = {
  id: string;
  slug: string;
  title: string;
  hero_title: string | null;
  hero_description: string | null;
  body_html: string;
  created_at: string;
  updated_at: string;
};

export type DbContactMessage = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string | null;
  status: "new" | "read" | "archived";
  created_at: string;
};

export type ContactMessageInsert = Omit<DbContactMessage, "id" | "created_at">;
