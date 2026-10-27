export type OverviewMetrics = {
  hotelRevenue: number;
  barSales: number;
  restaurantSales: number;
  unpaidBalance: number;
  guests: number;
  upcomingArrivals: number;
  bookingCount: number;
  revenue: number;
  unpaidBookings: number;
  enquiryCount: number;
};

export type LabeledAmount = { label: string; amount: number };
export type StackedSafari = { label: string; safari: number; hotel: number; bar: number };
export type StackedHospitality = { label: string; hotel: number; bar: number; restaurant: number };
export type NamedAmount = { name: string; amount: number };
export type NamedCount = { name: string; value: number };
export type ProductTotal = { name: string; quantity: number; amount: number };

export type OverviewCharts = {
  revenueLine: LabeledAmount[];
  revenueStack: StackedSafari[];
  countries: { country: string; amount: number }[];
  safariSlices: NamedCount[];
  department: StackedHospitality[];
  stays: LabeledAmount[];
  barSales: LabeledAmount[];
  barProducts: ProductTotal[];
  restaurantSales: LabeledAmount[];
  restaurantProducts: ProductTotal[];
};

export type OverviewRecentBooking = {
  id: number;
  customerName: string;
  package: string;
  startDate: string;
  status: string;
  paymentStatus: string;
};

export type OverviewRecentStay = {
  id: number;
  guest: string;
  roomType: string;
  nights: number;
  checkInDate: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
};

export type OverviewRecentPayment = {
  id: number;
  amount: number;
  currency: string;
  method: string | null;
  status: string;
  recordedAt: string | null;
  sourceLabel: string;
};
