// Serializable DTOs passed from server components/pages to client components.

export interface PublicCourse {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  price: number;
  offerPrice: number;
  offerText: string;
  offerEndDate: string | null;
}

export interface PublicBatch {
  id: string;
  batchName: string;
  startDate: string;
  endDate: string;
  capacity: number;
  seatsFilled: number;
  status: string;
}

export interface PublicTestimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  imageUrl: string;
  videoUrl: string;
  type: string;
  rating: number;
}

export interface PublicFaq {
  id: string;
  question: string;
  answer: string;
}
