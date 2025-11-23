export interface Booking {
  id: number;
  start: string;
  end: string;
  status: string;
  paymentStatus: string;
  type: string;
  notes: string | null;
  source: string | null;
  isBlock: boolean;
  players: number;
  playerOptions: Array<{
    id: number;
    quantity: number;
    name: string;
  }>;
  user: {
    id: number;
    email: string;
    name: string;
    isSystemUser: boolean;
  };
  extrasString: string;
  productIds: number[];
  bayRef: string;
  bayId: number;
  bayOptionId: number;
}

export type ViewMode = 'day' | '3days' | 'week';

